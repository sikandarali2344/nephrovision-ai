FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train the model at image build time so the container is ready to serve immediately.
# Falls back to the synthetic dataset if the real CSV wasn't placed in ml/data/.
RUN python ml/generate_synthetic_data.py && python ml/train_model.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
