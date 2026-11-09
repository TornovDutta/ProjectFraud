import logging
from typing import Dict, Any, List, Optional
import socket
from urllib.parse import urlparse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("cybersathi.database")

def is_mongo_reachable(url: str) -> bool:
    """Fast non-blocking socket check before initializing Motor topology."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 27017
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.1)
        res = s.connect_ex((host, port))
        s.close()
        return res == 0
    except Exception:
        return False

# In-memory document store fallback
class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.documents: Dict[str, Dict[str, Any]] = {}

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = doc.copy()
        doc_id = str(doc_copy.get("_id", f"mock_{len(self.documents) + 1}"))
        doc_copy["_id"] = doc_id
        self.documents[doc_id] = doc_copy
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_id)

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self.documents.values():
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc.copy()
        return None

    def find(self, query: Dict[str, Any] = None):
        if query is None:
            query = {}
            
        results = []
        for doc in self.documents.values():
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc.copy())
                
        class AsyncCursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=1):
                reverse = direction < 0
                self.items = sorted(self.items, key=lambda x: str(x.get(key, "")), reverse=reverse)
                return self
            async def to_list(self, length: Optional[int] = None):
                if length is not None:
                    return self.items[:length]
                return self.items
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
                    
        return AsyncCursor(results)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            target_id = str(target["_id"])
            if "$set" in update:
                self.documents[target_id].update(update["$set"])
            if "$push" in update:
                for k, v in update["$push"].items():
                    if k not in self.documents[target_id]:
                        self.documents[target_id][k] = []
                    self.documents[target_id][k].append(v)
            class UpdateResult:
                modified_count = 1
                matched_count = 1
            return UpdateResult()
        class UpdateResultZero:
            modified_count = 0
            matched_count = 0
        return UpdateResultZero()

    async def delete_one(self, query: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            target_id = str(target["_id"])
            if target_id in self.documents:
                del self.documents[target_id]
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        class DeleteResultZero:
            deleted_count = 0
        return DeleteResultZero()

    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        if not query:
            return len(self.documents)
        items = await self.find(query).to_list(None)
        return len(items)

class InMemoryDatabase:
    def __init__(self, name: str):
        self.name = name
        self.collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, collection_name: str) -> InMemoryCollection:
        if collection_name not in self.collections:
            self.collections[collection_name] = InMemoryCollection(collection_name)
        return self.collections[collection_name]

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_fallback: bool = False

    async def connect(self):
        if not is_mongo_reachable(settings.MONGODB_URL):
            logger.info("MongoDB server is not reachable locally. Using resilient in-memory datastore.")
            self.db = InMemoryDatabase(settings.DATABASE_NAME)
            self.is_fallback = True
            return

        try:
            client = AsyncIOMotorClient(
                settings.MONGODB_URL, 
                serverSelectionTimeoutMS=500
            )
            await client.admin.command('ping')
            self.client = client
            self.db = client[settings.DATABASE_NAME]
            self.is_fallback = False
            logger.info(f"Successfully connected to MongoDB at {settings.MONGODB_URL}")
        except Exception as e:
            logger.warning(f"Could not initialize MongoDB client ({e}). Falling back to resilient in-memory datastore.")
            if self.client:
                self.client.close()
                self.client = None
            self.db = InMemoryDatabase(settings.DATABASE_NAME)
            self.is_fallback = True

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

db_manager = DatabaseManager()

def get_db():
    if db_manager.db is None:
        db_manager.db = InMemoryDatabase(settings.DATABASE_NAME)
        db_manager.is_fallback = True
    return db_manager.db
