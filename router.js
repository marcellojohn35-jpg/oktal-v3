export class Router {
  constructor(routes) {
    this.routes = routes;
    this.init();
  }

  init() {
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname, false);
    });

    document.addEventListener('DOMContentLoaded', () => {
      this.handleRoute(window.location.pathname, false);
    });
  }

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.handleRoute(path, true);
  }

  handleRoute(path) {
    const routeHandler = this.routes[path] || this.routes['/'];
    if (routeHandler) {
      routeHandler();
    }
  }
}