import os
import platform
import subprocess
import sys
import shutil

def build_executable():
    """Build the Python backend into an executable using PyInstaller."""
    print("Building Python backend executable...")

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

if __name__ == "__main__":
    success = build_executable()
    sys.exit(0 if success else 1)
