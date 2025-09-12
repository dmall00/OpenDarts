FROM ultralytics/ultralytics:8.3.199-cpu

WORKDIR /app

COPY autoscore/ ./autoscore/
COPY detector/ ./detector/

RUN pip install --no-cache-dir \
    click>=8.2.1 \
    numpy>=2.2.6 \
    opencv-python>=4.11.0.86 \
    pydanclick>=0.5.1 \
    pydantic>=2.11.5 \
    websockets>=15.0.1

RUN rm -rf /tmp/* /var/tmp/*

EXPOSE 8765

CMD ["python", "-m", "autoscore.main", "--host", "0.0.0.0", "--port", "8765"]
