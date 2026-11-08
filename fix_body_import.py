p = 'backend/main.py'
with open(p, 'r', encoding='utf-8') as f:
    text = f.read()

target = 'from fastapi import FastAPI, UploadFile, File, HTTPException, Depends'
repl = 'from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Body'

if target in text:
    text = text.replace(target, repl, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS: Body added to fastapi imports')
else:
    print('TARGET NOT FOUND')
