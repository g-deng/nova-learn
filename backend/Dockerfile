FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# wait-for-it.sh sourced from https://github.com/vishnubob/wait-for-it
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# TODO: Prod ready?
CMD ["/wait-for-it.sh", "db:5432", "--", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]