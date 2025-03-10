#!/usr/bin/env python3
"""
Script to build and publish the DeepRead package to PyPI.
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

def build_frontend():
    """Build the React frontend."""
    print("\n=== Building Frontend ===\n")
    
    # Get the root directory
    root_dir = Path(__file__).parent
    frontend_dir = root_dir / "frontend"
    
    # Check if frontend directory exists
    if not frontend_dir.exists():
        print(f"Error: Frontend directory not found at {frontend_dir}")
        return False
    
    # Run npm build
    try:
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
        print("Frontend build successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building frontend: {e}")
        return False
    except FileNotFoundError:
        print("Error: npm not found. Make sure Node.js is installed and in your PATH.")
        return False

def build_package():
    """Build the Python package."""
    print("\n=== Building Python Package ===\n")
    
    # Clean previous build artifacts
    for dir_to_clean in ["dist", "build", "deepread.egg-info"]:
        if os.path.exists(dir_to_clean):
            print(f"Cleaning {dir_to_clean}...")
            shutil.rmtree(dir_to_clean)
    
    # Build the package
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "build"], check=True)
        subprocess.run([sys.executable, "-m", "build"], check=True)
        print("Package build successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building package: {e}")
        return False

def publish_package():
    """Publish the package to PyPI."""
    print("\n=== Publishing to PyPI ===\n")
    
    # Check if twine is installed
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "twine"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error installing twine: {e}")
        return False
    
    # Publish to PyPI
    try:
        subprocess.run([sys.executable, "-m", "twine", "upload", "dist/*"], check=True)
        print("Package published to PyPI successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error publishing package: {e}")
        return False

def main():
    """Main function."""
    print("Building and publishing DeepRead package to PyPI...")
    
    # Build frontend
    if not build_frontend():
        print("Error: Frontend build failed. Cannot continue.")
        return False
    
    # Build package
    if not build_package():
        print("Error: Package build failed. Cannot continue.")
        return False
    
    # Ask user if they want to publish
    response = input("\nDo you want to publish the package to PyPI? (y/n): ")
    if response.lower() == "y":
        if not publish_package():
            print("Error: Package publishing failed.")
            return False
    else:
        print("Package not published. You can publish it later with:")
        print("  python -m twine upload dist/*")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
