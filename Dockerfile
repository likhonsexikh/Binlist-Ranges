# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies that might be needed by Python packages
# No extra ones needed for this app, but this is where they would go.

# Copy the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# We are installing Flask, Gunicorn, and the scanner dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variables
ENV MODULE_NAME="app:app"
ENV BIND="0.0.0.0:8000"

# Run the application
# Gunicorn is a production-ready WSGI server.
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
