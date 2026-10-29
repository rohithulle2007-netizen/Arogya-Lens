def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["service"] == "Arogya Lens API"
    assert data["version"] == "1.0.0"
    assert data["health"] == "/api/health"


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "Arogya Lens API",
        "version": "1.0.0",
    }


def test_api_root_endpoint(client):
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["service"] == "Arogya Lens API"
    assert data["health"] == "/api/health"


def test_browser_html_endpoint(client):
    response = client.get("/", headers={"Accept": "text/html,application/xhtml+xml"})
    assert response.status_code == 200
    assert "Arogya Lens" in response.text
    assert "<!DOCTYPE html>" in response.text


def test_app_direct_endpoint(client):
    response = client.get("/app")
    assert response.status_code == 200
    assert "Arogya Lens" in response.text


def test_static_assets_mounted(client):
    css_res = client.get("/css/variables.css")
    assert css_res.status_code == 200

    js_res = client.get("/js/config.js")
    assert js_res.status_code == 200


def test_docs_endpoints(client):
    docs_res = client.get("/docs")
    assert docs_res.status_code == 200

    redoc_res = client.get("/redoc")
    assert redoc_res.status_code == 200

    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    assert openapi_res.json()["info"]["title"] == "Arogya Lens API"

