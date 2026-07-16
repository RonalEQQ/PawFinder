from datetime import datetime
import os

LOG_FOLDER = "logs"
LOG_FILE = "system_logs.txt"

# Crear carpeta logs si no existe
os.makedirs(LOG_FOLDER, exist_ok=True)

def write_log(action, detail):

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    message = f"[{now}] {action} - {detail}\n"

    path = os.path.join(LOG_FOLDER, LOG_FILE)

    with open(path, "a", encoding="utf-8") as file:
        file.write(message)

    print(message)