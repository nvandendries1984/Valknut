#!/bin/bash
# Valknut Discord Bot Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Function to display usage
usage() {
    echo "Usage: $0 {start|stop|restart|logs|status|deploy|rebuild|shell}"
    echo ""
    echo "Commands:"
    echo "  start     - Start the bot in detached mode"
    echo "  stop      - Stop the bot"
    echo "  restart   - Restart the bot"
    echo "  logs      - Show bot logs (follow mode)"
    echo "  status    - Show container status"
    echo "  deploy    - Deploy slash commands to Discord"
    echo "  rebuild   - Rebuild and restart the container"
    echo "  shell     - Open a shell in the container"
    exit 1
}

# Check if argument is provided
if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    start)
        echo -e "${GREEN}Starting Valknut Discord Bot...${NC}"
        docker compose up -d
        echo -e "${GREEN}Bot started! Use './bot.sh logs' to view logs${NC}"
        ;;
    stop)
        echo -e "${YELLOW}Stopping Valknut Discord Bot...${NC}"
        docker compose down
        echo -e "${GREEN}Bot stopped${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Restarting Valknut Discord Bot...${NC}"
        docker compose restart
        echo -e "${GREEN}Bot restarted${NC}"
        ;;
    logs)
        echo -e "${GREEN}Showing bot logs (Ctrl+C to exit)...${NC}"
        docker compose logs -f
        ;;
    status)
        echo -e "${GREEN}Container Status:${NC}"
        docker compose ps
        ;;
    deploy)
        echo -e "${GREEN}Deploying slash commands...${NC}"
        docker compose run --rm valknut-bot node src/deploy-commands.js
        echo -e "${GREEN}Commands deployed! Restart the bot if needed${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}Rebuilding and restarting bot...${NC}"
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        echo -e "${GREEN}Bot rebuilt and started${NC}"
        ;;
    shell)
        echo -e "${GREEN}Opening shell in container...${NC}"
        docker compose exec valknut-bot sh
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        usage
        ;;
esac
