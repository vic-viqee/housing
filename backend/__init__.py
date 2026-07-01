# This file makes the "backend" directory a Python package.
# Without it, we can't do "from backend.database import ..."
# or "python -m backend.seed".
# In Python 3.3+, this can be empty for namespace packages,
# but it's standard practice to include it explicitly.
