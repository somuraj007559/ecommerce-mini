class AppException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class DatabaseException(AppException):
    def __init__(self, message: str = "Database error"):
        super().__init__(message=message, status_code=500)


class DataProcessingException(AppException):
    def __init__(self, message: str = "Data processing error"):
        super().__init__(message=message, status_code=422)
