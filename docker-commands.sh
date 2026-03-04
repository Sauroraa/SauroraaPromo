#!/bin/bash

# 🐳 Promoteam - Docker Useful Commands
# Collection of common Docker operations for the Promoteam project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored headers
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Main menu
show_menu() {
    print_header "🐳 Promoteam Docker Commands"
    echo ""
    echo "1) Start all services"
    echo "2) Stop all services"
    echo "3) View logs"
    echo "4) View specific service logs"
    echo "5) Restart services"
    echo "6) Prune unused images/volumes"
    echo "7) Access service shell"
    echo "8) View Docker stats"
    echo "9) Rebuild specific service"
    echo "10) Full cleanup"
    echo "11) Exit"
    echo ""
}

# Start services
start_services() {
    print_header "Starting Services"
    docker-compose up -d
    print_success "Services started"
    sleep 3
    docker-compose ps
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    docker-compose down
    print_success "Services stopped"
}

# View all logs
view_logs() {
    print_header "Viewing All Logs (Ctrl+C to exit)"
    docker-compose logs -f --tail=100
}

# View specific service logs
view_service_logs() {
    print_header "Select service:"
    echo "1) Backend"
    echo "2) Frontend"
    echo "3) Database"
    echo "4) Redis"
    echo "5) Nginx"
    read -p "Enter choice [1-5]: " choice
    
    case $choice in
        1) 
            print_header "Backend Logs (Ctrl+C to exit)"
            docker-compose logs -f backend --tail=100
            ;;
        2)
            print_header "Frontend Logs (Ctrl+C to exit)"
            docker-compose logs -f frontend --tail=100
            ;;
        3)
            print_header "Database Logs (Ctrl+C to exit)"
            docker-compose logs -f mariadb --tail=100
            ;;
        4)
            print_header "Redis Logs (Ctrl+C to exit)"
            docker-compose logs -f redis --tail=100
            ;;
        5)
            print_header "Nginx Logs (Ctrl+C to exit)"
            docker-compose logs -f nginx --tail=100
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# Restart services
restart_services() {
    print_header "Restarting Services"
    docker-compose restart
    print_success "Services restarted"
    sleep 3
    docker-compose ps
}

# Prune unused resources
prune_resources() {
    print_header "Pruning Unused Docker Resources"
    print_warning "This will remove all unused images, containers, and volumes"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a --volumes -f
        print_success "Cleanup completed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Access service shell
access_shell() {
    print_header "Select service:"
    echo "1) Backend"
    echo "2) Frontend"
    echo "3) Database"
    echo "4) Redis"
    read -p "Enter choice [1-4]: " choice
    
    case $choice in
        1)
            print_header "Connecting to Backend Shell"
            docker-compose exec backend sh
            ;;
        2)
            print_header "Connecting to Frontend Shell"
            docker-compose exec frontend sh
            ;;
        3)
            print_header "Connecting to MariaDB"
            docker-compose exec mariadb mysql -p
            ;;
        4)
            print_header "Connecting to Redis"
            docker-compose exec redis redis-cli
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# View Docker stats
view_stats() {
    print_header "Docker Statistics (Ctrl+C to exit)"
    docker stats --no-stream
}

# Rebuild service
rebuild_service() {
    print_header "Select service to rebuild:"
    echo "1) Backend"
    echo "2) Frontend"
    echo "3) Both"
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            print_header "Rebuilding Backend"
            docker-compose build --no-cache backend
            print_success "Backend rebuilt"
            ;;
        2)
            print_header "Rebuilding Frontend"
            docker-compose build --no-cache frontend
            print_success "Frontend rebuilt"
            ;;
        3)
            print_header "Rebuilding All"
            docker-compose build --no-cache
            print_success "Services rebuilt"
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# Full cleanup
full_cleanup() {
    print_header "Full Cleanup"
    print_warning "This will stop containers and remove volumes"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        docker system prune -a --volumes -f
        print_success "Full cleanup completed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Useful Docker commands reference
show_reference() {
    clear
    print_header "Docker Commands Reference"
    echo ""
    echo "📦 Image Commands:"
    echo "  docker images                    # List all images"
    echo "  docker rmi <image-id>            # Remove image"
    echo "  docker image prune               # Remove unused images"
    echo ""
    echo "🐳 Container Commands:"
    echo "  docker ps                        # List running containers"
    echo "  docker ps -a                     # List all containers"
    echo "  docker stop <container>          # Stop container"
    echo "  docker rm <container>            # Remove container"
    echo ""
    echo "📚 Docker Compose Commands:"
    echo "  docker-compose up -d             # Start services"
    echo "  docker-compose down              # Stop services"
    echo "  docker-compose logs -f           # View logs"
    echo "  docker-compose exec <svc> sh     # Access shell"
    echo "  docker-compose ps                # Show status"
    echo "  docker-compose build             # Build images"
    echo ""
    echo "🔍 Debugging:"
    echo "  docker logs <container-id>       # View container logs"
    echo "  docker inspect <container>       # Get container info"
    echo "  docker stats                     # View resource usage"
    echo ""
    read -p "Press Enter to return to menu..."
}

# Main loop
if [[ $# -eq 0 ]]; then
    # Interactive mode
    while true; do
        clear
        show_menu
        read -p "Enter your choice [1-11]: " choice
        
        case $choice in
            1) clear; start_services; read -p "Press Enter to continue..." ;;
            2) clear; stop_services; read -p "Press Enter to continue..." ;;
            3) clear; view_logs; read -p "Press Enter to continue..." ;;
            4) clear; view_service_logs; read -p "Press Enter to continue..." ;;
            5) clear; restart_services; read -p "Press Enter to continue..." ;;
            6) clear; prune_resources; read -p "Press Enter to continue..." ;;
            7) clear; access_shell; read -p "Press Enter to continue..." ;;
            8) clear; view_stats; read -p "Press Enter to continue..." ;;
            9) clear; rebuild_service; read -p "Press Enter to continue..." ;;
            10) clear; full_cleanup; read -p "Press Enter to continue..." ;;
            11) clear; echo "Goodbye!"; exit 0 ;;
            *)
                clear
                print_error "Invalid choice"
                ;;
        esac
    done
else
    # Command line mode
    case $1 in
        start) start_services ;;
        stop) stop_services ;;
        logs) view_logs ;;
        restart) restart_services ;;
        clean) prune_resources ;;
        stats) view_stats ;;
        rebuild) rebuild_service ;;
        fullclean) full_cleanup ;;
        ref|reference) show_reference ;;
        *)
            echo "Usage: $0 {start|stop|logs|restart|clean|stats|rebuild|fullclean|ref}"
            echo ""
            echo "Run without arguments for interactive mode:"
            echo "  $0"
            ;;
    esac
fi
