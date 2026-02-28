from routers.books import router as books_router
from routers.members import router as members_router
from routers.loans import router as loans_router
from routers.reports import router as reports_router
from routers.auth import router as auth_router
from routers.settings import router as settings_router
from routers.system import router as system_router
from routers.metadata import router as metadata_router

__all__ = ["books_router", "members_router", "loans_router", "reports_router",
           "auth_router", "settings_router", "system_router", "metadata_router"]
