import http.server
import socketserver
import json
import os
from random import randint
import urllib.parse

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Парсим URL
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Для API endpoint
        if parsed_path.path == '/api/tracks':
            tracks = self.scan_mp3_files()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(tracks).encode())
            return
            
        # Для всех остальных запросов используем стандартный обработчик
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def scan_mp3_files(self):
        # Создаем папку audio если её нет
        audio_dir = os.path.join(os.path.dirname(__file__), 'audio')
        if not os.path.exists(audio_dir):
            os.makedirs(audio_dir)
        
        try:
            # Получаем список MP3 файлов
            files = [f for f in os.listdir(audio_dir) if f.lower().endswith('.mp3')]
            return [{'file': file, 'color': f"hsl({randint(0, 360)}, 70%, 70%)"} for file in files]
        except Exception as e:
            print(f"Ошибка при сканировании MP3 файлов: {e}")
            return []

# Настройка и запуск сервера
PORT = 3000
Handler = RequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Сервер запущен на порту {PORT}")
    # Выводим список найденных MP3 файлов
    tracks = Handler.scan_mp3_files(None)
    print("Доступные MP3 файлы:", ", ".join(track['file'] for track in tracks))
    # Запускаем сервер
    httpd.serve_forever() 