#!/usr/bin/env python3
"""
Command-line interface for DeepRead.
"""

import argparse
import os
import sys
import uvicorn
from pathlib import Path

def get_frontend_dir():
    """
    Get the path to the frontend build directory.
    
    This function tries to locate the frontend build directory in various places:
    1. In the package installation directory
    2. In the development environment
    """
    # Check if we're in a package installation
    package_dir = Path(__file__).parent
    
    # Try to find frontend in package data
    frontend_in_package = package_dir / "frontend"
    if frontend_in_package.exists():
        return str(frontend_in_package)
    
    # Try to find frontend in development environment
    repo_root = package_dir.parent
    frontend_in_dev = repo_root / "frontend" / "dist"
    if frontend_in_dev.exists():
        return str(frontend_in_dev)
    
    # If frontend is not found, return None
    return None

def serve_command(args):
    """Start the DeepRead server."""
    from backend.main import app
    
    # Set environment variable for frontend directory
    frontend_dir = get_frontend_dir()
    if frontend_dir:
        os.environ["DEEPREAD_FRONTEND_DIR"] = frontend_dir
    
    # Start the server
    print(f"Starting DeepRead server on http://{args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)

def version_command(args):
    """Display the DeepRead version."""
    from importlib.metadata import version
    try:
        ver = version("deepread")
        print(f"DeepRead version {ver}")
    except:
        print("DeepRead version unknown (development mode)")

def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(description="DeepRead - PDF reading and analysis application")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Serve command
    serve_parser = subparsers.add_parser("serve", help="Start the DeepRead server")
    serve_parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    serve_parser.set_defaults(func=serve_command)
    
    # Version command
    version_parser = subparsers.add_parser("version", help="Display the DeepRead version")
    version_parser.set_defaults(func=version_command)
    
    # Parse arguments
    args = parser.parse_args()
    
    # If no command is specified, show help
    if not args.command:
        parser.print_help()
        return
    
    # Run the specified command
    args.func(args)

if __name__ == "__main__":
    main() 
