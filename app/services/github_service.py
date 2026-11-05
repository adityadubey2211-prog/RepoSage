
import requests
from urllib.parse import urlparse


def extract_repo_details(repo_url):
    """
    Extract owner and repository name from GitHub URL.
    """

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
            "open_issues_count": data["open_issues_count"]
        }

    except requests.exceptions.HTTPError as error:
        print("HTTP error occurred:", error)

    except requests.exceptions.RequestException as error:
        print("Request error occurred:", error)

    return None
