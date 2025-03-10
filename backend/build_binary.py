#!/usr/bin/env python3
"""
Build script for DeepRead application.
This script builds the backend into an executable using PyInstaller.

Command line options:
  None
"""

import os
import subprocess
import sys
import platform
import shutil

def get_executable_name():
    if platform.system() == "Windows":
        return "backend.exe"
    else:
        return "backend"


def get_executable_path():
    """Get the path to the built executable."""
    root_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(root_dir, "dist", get_executable_name())


def build_backend():
    """Build the Python backend into an executable using PyInstaller."""
    print("\n=== Building Backend ===\n")

    executable_name = get_executable_name()

    # Clean previous build artifacts
    if os.path.exists("dist"):
        print("Cleaning previous build artifacts...")
        shutil.rmtree("dist")
    if os.path.exists("build"):
        shutil.rmtree("build")
    if os.path.exists(f"{executable_name}.spec"):
        os.remove(f"{executable_name}.spec")

    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", executable_name,
        "--hidden-import", "openai",
        "main.py"
    ]

    # Run PyInstaller
    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully built executable: {executable_name}")

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

        # Change back to root directory
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building executable: {e}")
        # Change back to root directory
        return False


def main():
    """Main build function."""
    print("Building DeepRead application...")

    # Build backend
    backend_success = build_backend()
    if not backend_success:
        print("Error: Backend build failed.")
        return False

    # Get the executable path
    executable_path = get_executable_path()

    print("\n=== Build Complete ===")
    print(f"The application has been built successfully!")
    print(f"Executable location: {executable_path}")
    print("\nTo run the application:")
    print(f"  {executable_path}")

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
