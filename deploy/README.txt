Deployment notes:
- Copy the repository to /opt/arthive on the Ubuntu server.
- Create /opt/arthive/arthive-backend/.env from arthive-backend/.env.example.
- Place the model files under /opt/arthive/models/image_price_regressor_feedback_v2/best_model.pt.
- Run deploy/setup-server.sh once to install Docker and Nginx.
- GitHub Actions uses .github/workflows/deploy.yml to SSH into the server, rebuild Docker images, and reload host Nginx.
