import requests
from urllib.parse import urlparse
import base64


def extract_repo_details(repo_url):


    parsed_url = urlparse(str(repo_url))

    if parsed_url.netloc.lower() not in ["github.com", "www.github.com"]:
        raise ValueError("Invalid GitHub URL")

    path_parts = parsed_url.path.strip("/").split("/")

    if len(path_parts) < 2:
        raise ValueError("Invalid repository URL")

    owner = path_parts[0]
    repo = path_parts[1]

    if repo.endswith(".git"):
        repo = repo[:-4]

    return owner, repo


def get_repository(owner, repo):
    """
    Fetch repository information using GitHub REST API.
    """

    url = f"https://api.github.com/repos/{owner}/{repo}"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        return {
            "name": data["name"],
            "full_name": data["full_name"],
            "description": data["description"],
            "stargazers_count": data["stargazers_count"],
            "language": data["language"],
            "html_url": data["html_url"],
            "forks_count": data["forks_count"],
            "open_issues_count": data["open_issues_count"],
            "default_branch": data["default_branch"]
        }

    except requests.exceptions.HTTPError as error:
        print("HTTP error occurred:", error)

    except requests.exceptions.RequestException as error:
        print("Request error occurred:", error)

    return None


def get_repository_tree(owner, repo, branch):
    """
    Fetch complete Repository file structure form Github
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    
    try:
        response = requests.get(url, timeout = 10)
        response.raise_for_status()
        data = response.json()
        
        
        files = []
        for item in data["tree"]:
            files.append({
                "path": item["path"],
                "type": item["type"],  
            })
        return files
    except requests.exceptions.HTTPError as error:
        print("HTTP error occurred:", error)
    
    except requests.exceptions.RequestException as error:
        print("GitHub tree API error:", error)
        
    return None


def get_file_content(owner, repo, file_path):
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
    
    try:
        response = requests.get(url, timeout = 10)
        response.raise_for_status()
        
        
        
        data = response.json()
        
        content = data["content"]
        
        
        decoded_content = base64.b64decode(content).decode("utf-8")
        return decoded_content
    
    
    except requests.exceptions.HTTPError as error:
        print("GitHub file API error:", error)
    except (KeyError, ValueError) as error:
        print("Error decoding file content:", error)
        
    return None
    
    
    
def categorize_files(files):
    source_files = []
    documentation_files = []
    config_files = []
    ignored_folders = (
        "node_modules",
        "venv",
        ".venv",
        "__pycache__",
        ".git",
        "dist",
        "build",
        "coverage"
    )
    for file in files:
        if file["type"] == "blob":
            path = file["path"].lower()
            
            filename = path.split("/")[-1]
            if any(folder in path.split("/") for folder in ignored_folders):
                continue
            elif path.endswith((".py", ".js", ".ts", ".jsx", ".tsx", ".cpp", ".c", ".h", ".hpp", ".java", ".go", ".rs", ".php", ".rb", ".cs", ".html", ".css", ".sql")):
                source_files.append(file["path"])
            elif path.endswith((".json", ".yaml", ".yml", ".toml", ".ini", ".cfg")):
                config_files.append(file["path"])
            elif filename in ("requirements.txt", "dockerfile", "makefile", "procfile"):
                config_files.append(file["path"])
            elif path.endswith((".md", ".rst", ".txt")):
                documentation_files.append(file["path"])

    return {
        "source_files": source_files,
        "documentation_files": documentation_files,
        "config_files": config_files
    }