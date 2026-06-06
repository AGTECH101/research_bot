from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import requests
import urllib.parse
import os

app = FastAPI()
templates = Jinja2Templates(directory='templates')
app.mount('/static', StaticFiles(directory='static'), name='static')

# Allow configuring the User-Agent (and other settings) via environment variables
DEFAULT_USER_AGENT = 'HistoryExplorer/1.0 (https://historyexplorer.com; contact@historyexplorer.com)'
USER_AGENT = os.environ.get('USER_AGENT', DEFAULT_USER_AGENT)
HEADERS = {'User-Agent': USER_AGENT}

def fetch_full_article(title: str) -> str:
    """Fetch full HTML content of a Wikipedia article using action=parse."""
    api_url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "parse",
        "page": title,
        "format": "json",
        "prop": "text",
        "redirects": "1"
    }
    resp = requests.get(api_url, headers=HEADERS, params=params)
    if resp.status_code == 200:
        data = resp.json()
        # The content is inside data['parse']['text']['*']
        return data.get('parse', {}).get('text', {}).get('*', 'Content unavailable.')
    return "Failed to load full article."

@app.get('/')
async def homeView(request: Request):
    return templates.TemplateResponse(
        request=request,
        name='index.html',
        context={'username': 'Genius'}
    )

@app.post('/search')
async def searchView(request: Request, query: str = Form(...)):
    # Step 1: Get summary (includes title, extract, thumbnail)
    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
    response = requests.get(summary_url, headers=HEADERS)
    
    if response.status_code != 200:
        return templates.TemplateResponse(
            request=request,
            name='index.html',
            context={'username': 'Genius', 'error': f'No article found for "{query}"'}
        )
    
    data = response.json()
    title = data.get('title', '')
    
    # Step 2: Fetch full article HTML
    full_html = fetch_full_article(title)
    
    thumbnail = data.get('thumbnail', {})
    thumb_url = thumbnail.get('source') if thumbnail else None
    
    return templates.TemplateResponse(
        request=request,
        name='explore.html',
        context={
            'title': title,
            'subtitle': data.get('description', ''),
            'content': data.get('extract', 'No summary available.'),
            'thumbnail': thumb_url,
            'article': full_html   # full HTML content for your detail page
        }
    )

@app.get('/random')
async def randomView(request: Request):
    # Get a random page title
    random_url = "https://en.wikipedia.org/api/rest_v1/page/random/summary"
    resp = requests.get(random_url, headers=HEADERS)
    if resp.status_code != 200:
        return templates.TemplateResponse(
            request=request,
            name='index.html',
            context={'username': 'Genius', 'error': 'Could not fetch random article.'}
        )
    
    data = resp.json()
    title = data.get('title', '')
    full_html = fetch_full_article(title)
    
    thumbnail = data.get('thumbnail', {})
    thumb_url = thumbnail.get('source') if thumbnail else None
    
    return templates.TemplateResponse(
        request=request,
        name='explore.html',
        context={
            'title': title,
            'subtitle': data.get('description', ''),
            'content': data.get('extract', 'No summary available.'),
            'thumbnail': thumb_url,
            'article': full_html
        }
    )



@app.get('/full_article')
async def get_full_article(title: str):
    """Return the full HTML content of a Wikipedia article."""
    html = fetch_full_article(title)  # your existing function
    return {"article_html": html}


if __name__ == '__main__':
    # Simple local runner for development: reads PORT from env (default 8000)
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('main:app', host='0.0.0.0', port=port, reload=True)