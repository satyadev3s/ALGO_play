from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app=Flask(__name__)
CORS(app)
db=mysql.connector.connect(
    host="localhost",
    user="root",
    password="spacegp_infinite1",
    database="dd"

)
ps=0
@app.route("/submit",methods=["POST"])
def submit():
    data=request.json
    personid=ps+1
    username=data.get("name")
    email=data.get("email")
    password=data.get("password")

    cursor=db.cursor()
    sql="INSERT INTO mydata (personid,username, email,password) VALUES (%s, %s, %s, %s)"
    values=(personid, username, email, password)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"status": "success", "message": "Data submitted successfully"})
if __name__=="__main__":
    app.run(debug=True)