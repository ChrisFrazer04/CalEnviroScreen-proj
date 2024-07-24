from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
from pathlib import Path
from matplotlib.lines import Line2D
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import math
from Scripts.clean_functions import calculate_dac_score, get_tract_changes, get_funding_reallocation_24
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.orm import DeclarativeBase
#from Scripts.Graph_functions import funding_barplot, changes_scatterplot, changes_barplot

app = Flask(__name__)
CORS(app)
plt.ioff()
plt.style.use('seaborn-v0_8-dark')

current_dir = Path(__file__).parent
ces_df = pd.read_csv(f"{current_dir}/cleaned_data/cleaned_ces_cdc.csv")
old_score = pd.read_csv(f"{current_dir}/cleaned_data/default_score.csv")
    

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///./database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy()

db.init_app(app)

# Define a model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

# Create the database tables
with app.app_context():
    db.create_all()


from routes import bp

app.register_blueprint(bp)

if __name__ == '__main__':
    app.run(debug=True)