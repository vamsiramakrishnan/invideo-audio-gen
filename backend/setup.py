from setuptools import setup, find_packages

setup(
    name="podcast-generator",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "python-multipart",
        "google-cloud-aiplatform",
        "google-genai",
        "pydub",
        "python-dotenv",
    ],
) 