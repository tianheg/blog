#!/usr/bin/env python3
"""把 allowlist 里那几张照片的 t/（800px）与 h/（1600px）变体镜像到 static/_photos/，
供本地 hugo serve 引用（本地没有 Worker，资产路径 /photos/ 走不通）。

只按白名单拉 —— 一个不在清单里的字节都不下。static/_photos/ 已在 .gitignore，
产物是私人照片副本，绝不入库（git status 校验是验收项）。
"""
import json
import os
import sys

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOW = os.path.join(BLOG, "scripts", "photos-allowlist.json")
DEST = os.path.join(BLOG, "static", "_photos")
SECRETS = "/root/.hermes/secrets/pve.env"

VARIANTS = ["t", "h"]


def s3():
    import boto3
    from botocore.config import Config

    env = {}
    for line in open(SECRETS):
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k] = v.strip().strip("'\"")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=env["R2_IMG_ACCESS_KEY_ID"],
        aws_secret_access_key=env["R2_IMG_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
    )


def main():
    keys = json.load(open(ALLOW))
    if not keys:
        sys.exit("allowlist 为空 —— 先跑 gen-photos-data.py 生成清单")
    client = s3()
    got = miss = cached = 0
    for key in keys:
        for v in VARIANTS:
            dst = os.path.join(DEST, v, key)
            if os.path.exists(dst) and os.path.getsize(dst) > 0:
                cached += 1
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            try:
                obj = client.get_object(Bucket="img", Key=f"{v}/{key}")
                body = obj["Body"].read()
            except Exception as e:  # noqa: BLE001
                miss += 1
                print(f"FAIL {v}/{key}: {type(e).__name__}: {str(e)[:90]}")
                continue
            if not body:
                miss += 1
                print(f"FAIL {v}/{key}: 0-byte object")
                continue
            tmp = dst + ".part"
            with open(tmp, "wb") as f:
                f.write(body)
            os.replace(tmp, dst)
            got += 1
            print(f"ok {v}/{key} {len(body) // 1024}KB")
    print(f"mirror done: {got} fetched, {cached} cached, {miss} failed → {DEST}")
    if miss:
        sys.exit(1)


if __name__ == "__main__":
    main()