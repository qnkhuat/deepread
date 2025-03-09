#!/usr/bin/env python3
"""
Build script for DeepRead application.
This script builds both the frontend and backend, and packages them together.
"""

import os
import subprocess
import sys
import platform
import shutil

def build_frontend():
    """Build the React frontend."""
    print("\n=== Building Frontend ===")
    
    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend directory not found at {frontend_dir}")
        return False
    
    # Run npm build
    try:
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
        print("Frontend build successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building frontend: {e}")
        return False

def build_backend():
    """Build the Python backend into an executable using PyInstaller."""
    print("\n=== Building Backend with Frontend ===")
    
    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Determine the appropriate executable name based on platform
    if platform.system() == "Windows":
        executable_name = "backend.exe"
    else:
        executable_name = "backend"

    # Clean previous build artifacts
    if os.path.exists("dist"):
        print("Cleaning previous build artifacts...")
        shutil.rmtree("dist")
    if os.path.exists("build"):
        shutil.rmtree("build")
    if os.path.exists(f"{executable_name}.spec"):
        os.remove(f"{executable_name}.spec")
    
    # Get the frontend build directory
    frontend_dir = os.path.join(root_dir, "frontend", "dist")
    
    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend build directory not found at {frontend_dir}")
        print("Cannot build backend without frontend files. Please build the frontend first.")
        return False

    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", executable_name,
        "--hidden-import", "openai",
        "--add-data", f"{frontend_dir}{os.pathsep}frontend",
        "main.py"
    ]

    # Run PyInstaller
    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully built executable: {executable_name}")

        # Copy .env file to dist directory if it exists
        if os.path.exists(".env"):
            shutil.copy(".env", os.path.join("dist", ".env"))
            print("Copied .env file to dist directory")

        # On macOS, ensure the executable has proper permissions
        if platform.system() == "Darwin":
            executable_path = os.path.join("dist", executable_name)
            os.chmod(executable_path, 0o755)
            print(f"Set executable permissions for {executable_path}")

            # Verify the executable works
            try:
                result = subprocess.run([executable_path, "--version"],
                                       capture_output=True,
                                       text=True,
                                       timeout=5)
                if result.returncode != 0:
                    print(f"Warning: Executable test failed with code {result.returncode}")
                    print(f"Output: {result.stdout}")
                    print(f"Error: {result.stderr}")
                else:
                    print("Executable test successful")
            except subprocess.TimeoutExpired:
                print("Executable test timed out, but this might be normal for a server process")
            except Exception as e:
                print(f"Warning: Failed to test executable: {e}")

        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building executable: {e}")
        return False

def main():
    """Main build function."""
    print("Building DeepRead application...")
    
    # Always build frontend first
    frontend_success = build_frontend()
    if not frontend_success:
        print("Error: Frontend build failed. Cannot continue with backend build.")
        return False
    
    # Build backend only if frontend build was successful
    backend_success = build_backend()
    if not backend_success:
        print("Error: Backend build failed.")
        return False
    
    # Get the root directory and determine executable path
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    
    # Determine the executable name based on platform
    if platform.system() == "Windows":
        executable_name = "backend.exe"
    else:
        executable_name = "backend"
    
    executable_path = os.path.join(backend_dir, "dist", executable_name)
    
    print("\n=== Build Complete ===")
    print(f"The application has been built successfully!")
    print(f"Executable location: {executable_path}")
    print("\nTo run the application:")
    print(f"  {executable_path}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
