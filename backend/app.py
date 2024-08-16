from flask import Flask
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)

current_dir = Path(__file__).parent
    

from routes import bp

app.register_blueprint(bp)

if __name__ == '__main__':
    app.run(debug=True)