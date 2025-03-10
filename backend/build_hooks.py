# in your_package/build.py
import subprocess, os, platform
from setuptools.build_meta import *  # inherit the standard backend

# Save reference to original functions BEFORE overriding them
__orig_build_wheel = build_wheel
__orig_build_editable = build_editable

def build_frontend():
    """Build the React frontend."""
    print("\n=== Building Frontend ===\n")

    # Get the root directory
    root_dir = os.path.dirname(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../"))
    frontend_dir = os.path.join(root_dir, "frontend")

    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend directory not found at {frontend_dir}")
        return None

    # On Windows, we need to use npm.cmd instead of npm
    npm_cmd = "npm.cmd" if platform.system() == "Windows" else "npm"

    # Run npm build
    try:
        subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
        subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
        print("Frontend build successful!")
    except subprocess.CalledProcessError as e:
        print(f"Error building frontend: {e}")
    except FileNotFoundError:
        print(f"Error: {npm_cmd} not found. Make sure Node.js is installed and in your PATH.")

def build_wheel(wheel_directory, config_settings=None, metadata_directory=None):
    build_frontend()
    return __orig_build_wheel(wheel_directory, config_settings, metadata_directory)

def build_editable(wheel_directory, config_settings=None, metadata_directory=None):
    build_frontend()
    return __orig_build_editable(wheel_directory, config_settings, metadata_directory)
