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
    

from routes import bp

app.register_blueprint(bp)

if __name__ == '__main__':
    app.run(debug=True)