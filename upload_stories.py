import json
import firebase_admin
from firebase_admin import credentials, firestore

# === 1. 初始化 Firebase Admin ===
cred = credentials.Certificate(
    '/Users/a0/Desktop/aiko-mobile/billionare-501bf-firebase-adminsdk-fbsvc-2dad5e32f5.json')
firebase_admin.initialize_app(cred)

# === 2. 获取 Firestore 客户端 ===
db = firestore.client()

# === 3. 要上传的数据 ===
data = [
    {
        "display_fields": {
            "Storyname": "门扉后的呢喃",
            "Storyimage": "一扇斑驳古旧的木门半开着，门缝中透出诡异的深红色光芒，门外是几个神情各异、紧张站立的人影。",
            "synopsis": "当死亡的阴影笼罩，你们被一扇神秘的铁门拉入了一个无人生还的诡异世界。在这里，真相被谎言包裹，每一步都可能踏入深渊，你们必须在理智崩溃前找到唯一的生路。",
            "player_count": "4人"
        },
        "user_facing_content": {
            "character_setup": [
                {"character_name": "顾影", "description": "一位经验丰富的“过门者”，神情冷漠，眼神中透露着不属于这个年纪的疲惫与警惕。",
                    "objective": "找到第十二扇门，并揭开所有门的最终秘密。"},
                {"character_name": "夏乐", "description": "第一次进入门内世界的新人，脸色苍白，眼神里充满了恐惧和不知所措。",
                    "objective": "不惜一切代价活下去，并回到现实世界。"},
                {"character_name": "秦风", "description": "一个身材健硕、看起来很可靠的退役军人，时刻保持着冷静和观察。",
                    "objective": "保护更多的人活下去，维持团队的秩序。"},
                {"character_name": "文珊", "description": "戴着金丝眼镜的知性女性，似乎对超自然现象有深入研究，显得异常镇定。",
                    "objective": "记录门内世界的一切规则和现象，将其作为研究课题。"}
            ],
            "opening_choices": [
                {"character_id": "顾影", "prompt": "作为经验者，你深知门内世界的险恶。踏入这座废弃医院的大厅，你的首要行动是？",
                 "options": [
                     {"id": "A_option_1", "strategy": "勘察环境",
                         "text": "立刻观察大厅的布局，寻找可能的出口、藏身处以及潜在的危险源。"},
                     {"id": "A_option_2", "strategy": "稳定人心",
                         "text": "向惊慌的新人简要说明情况，用你丰富的经验建立领导地位，稳定团队情绪。"},
                     {"id": "A_option_3", "strategy": "寻找线索",
                         "text": "无视他人，直接走向前台的登记册，你相信最关键的线索往往在最显眼的地方。"}
                 ]},
                # 其余角色选项省略，为简洁
            ]
        },
        "model_facing_content": {
            "global_story_background": {
                "prologue": "世界上存在一个无法用科学解释的系统。当人们濒临死亡或产生极端情绪时，有一定几率会看到一扇“门”。推开门，就是九死一生的诡异世界。",
                "setting": "核心场景是“门”后的世界，这是一个由十二个难度递增的副本构成的系统。",
                "core_conflict": "核心冲突在于玩家与门内鬼怪、致命规则之间的生存对抗。"
            },
            "character_pool": [
                {"character_name": "顾影", "public_identity": "经验丰富的过门者，团队的领导者。",
                    "secret_objective": "他一直在寻找一个在门内世界失踪的爱人。"},
                {"character_name": "夏乐", "public_identity": "被意外卷入的普通大学生。",
                    "secret_objective": "活下去。"},
                {"character_name": "秦风", "public_identity": "富有正义感的退役军人。",
                    "secret_objective": "他怀疑事件与失踪的战友有关。"},
                {"character_name": "文珊", "public_identity": "超自然现象研究学者。",
                    "secret_objective": "她进入这里是主动行为，目的是收集数据。"}
            ]
        }
    },
    # 其他故事同理，可继续追加
]

# === 4. 上传数据到 Firestore ===
collection_ref = db.collection('livestory').document(
    'script').collection('stories')

for story in data:
    story_name = story["display_fields"]["Storyname"]
    doc_ref = collection_ref.document(story_name)
    doc_ref.set(story)
    print(f"✅ 已上传故事：{story_name}")

print("🎉 所有故事上传完成！")
