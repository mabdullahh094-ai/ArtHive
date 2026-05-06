import requests

u = "https://artreserves.com/"
r = requests.get(u, timeout=20)
print("status", r.status_code)
print("len", len(r.text))
print(r.text[:400].replace("\n", " "))
