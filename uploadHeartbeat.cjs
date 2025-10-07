// npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.local.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 你的 narrative_block 数据
const HeartbeatData = {
  "display_fields": {
    "Storyname": "奇想岛：心动的瞬间",
    "Storyimage": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C.jpg",
    "category_tags": [
      "#恋爱",
      "#真人秀",
      "#现代",
      "#博弈"
    ],
    "synopsis": "在未来主义的“奇想岛”上，四位精心挑选的单身男女，上演的是浪漫爱情追逐，还是一场充满谎言与试探的心理战？",
    "player_count": "4人",
    "estimated_playtime": "30-45分钟"
  },
  "user_facing_content": {
    "character_setup": [
      {
        "character_name": "凌肖",
        "description": "23岁，新锐艺术家。外表冷峻，言语犀利，仿佛对一切都漠不关心。",
        "objective": "找到能理解他艺术的“缪斯”，并为她创作一幅专属作品。"
      },
      {
        "character_name": "顾远",
        "description": "25岁，阳光开朗的科技公司CEO。温暖真诚，是典型的“犬系男友”。",
        "objective": "在不刻意讨好的前提下，成为本季公认的“人气王”。"
      },
      {
        "character_name": "纪繁星",
        "description": "22岁，时尚美妆博主。外表甜美无害，常常“不经意”地犯些小迷糊。",
        "objective": "成为本季的“CP女王”，让至少两位男嘉宾为自己倾心。"
      },
      {
        "character_name": "秦岚",
        "description": "24岁，悬疑小说家。言语犀利，观察力敏锐，总与众人保持距离。",
        "objective": "将本次经历改编为畅销小说，为此需要搜集到最真实、最劲爆的素材。"
      }
    ],
    "opening_choices": [
      {
        "comment": "为每个角色提供开局策略选择，玩家在游戏开始前为自己的角色选定一项。",
        "character_id": "凌肖",
        "context": "作为一位追求纯粹艺术的艺术家，你对这种充满表演性质的恋爱真人秀嗤之以鼻，但为了找到真正的“缪斯”，你选择入局。",
        "prompt": "作为凌肖，你踏入这座浮华的别墅，你的第一姿态是？",
        "options": [
          {
            "id": "LX_option_1",
            "strategy": "高冷观察",
            "text": "保持距离，言简意赅。用审视的目光洞察每一个人，判断谁的灵魂配得上你的艺术。"
          },
          {
            "id": "LX_option_2",
            "strategy": "艺术优先",
            "text": "无视他人，首先关注环境中的艺术元素。只对能与你聊艺术的人，施舍一丝注意力。"
          },
          {
            "id": "LX_option_3",
            "strategy": "意外反差",
            "text": "在所有人以为你冷漠的时候，对某个不起眼的细节（比如一只猫）展现瞬间的温柔，制造神秘感。"
          }
        ]
      },
      {
        "character_id": "顾远",
        "context": "作为一名成功的年轻CEO，你习惯于掌控全局并获得认可。这次的目标，是全场的人气王。",
        "prompt": "作为顾远，你想成为所有人的太阳，你的第一步是？",
        "options": [
          {
            "id": "GY_option_1",
            "strategy": "主动破冰",
            "text": "主动承担起活跃气氛的责任，照顾到每一个人，用你的阳光和真诚快速获得所有人的好感。"
          },
          {
            "id": "GY_option_2",
            "strategy": "展现价值",
            "text": "在交谈中不经意地展露你的成功事业和领导力，让他人意识到你的“领袖”地位。"
          },
          {
            "id": "GY_option_3",
            "strategy": "骑士精神",
            "text": "重点关注看起来最需要帮助的女性，第一时间提供帮助，树立温柔体贴的“守护者”形象。"
          }
        ]
      },
      {
        "character_id": "纪繁星",
        "context": "你深知自己的外貌优势，也精通人际交往的技巧。你的目标很明确——成为所有雄性竞争的焦点。",
        "prompt": "作为纪繁星，拉开“CP女王”争夺战的序幕，你的第一招是？",
        "options": [
          {
            "id": "JFX_option_1",
            "strategy": "无害的麻烦制造者",
            "text": "通过一些“小意外”创造与其他嘉宾，特别是男嘉宾，发生肢体接触和互动机会的契机。"
          },
          {
            "id": "JFX_option_2",
            "strategy": "锁定优绩股",
            "text": "迅速判断出场上最有价值的男性，并集中火力对他展开攻势，展现你的崇拜和兴趣。"
          },
          {
            "id": "JFX_option_3",
            "strategy": "建立“闺蜜”人设",
            "text": "先与女嘉宾搞好关系，降低她的戒心，同时在聊天中不动声色地收集男嘉宾的情报。"
          }
        ]
      },
      {
        "character_id": "秦岚",
        "context": "对你而言，这里不是恋爱小屋，而是一个人性的试验场。他们都是你未来畅销书的角色。",
        "prompt": "作为秦岚，为了搜集到最劲爆的小说素材，你的写作开篇方式是？",
        "options": [
          {
            "id": "QL_option_1",
            "strategy": "隐形记录者",
            "text": "保持沉默，成为墙角的隐形人。在所有人放松警惕时，默默观察记录下最真实的细节。"
          },
          {
            "id": "QL_option_2",
            "strategy": "信息刺探者",
            "text": "用一个看似无意却直击要害的问题，打破所有人的社交面具，激化矛盾，观察反应。"
          },
          {
            "id": "QL_option_3",
            "strategy": "建立情报网",
            "text": "与看起来最“无害”或最“话多”的人建立初步信任，让他/她成为你获取信息的渠道。"
          }
        ]
      }
    ]
  },
  "model_facing_content": {
    "global_story_background": {
      "prologue": "《奇想岛》是一档现象级恋爱真人秀，以“高科技+高颜值+高压力”著称。本季嘉宾均从百万网友的投票中诞生，自带流量和话题。他们的一举一动都被无数摄像头记录，并被实时解读、投票，巨大的舆论压力是游戏的一部分。",
      "setting": "故事发生在一座与世隔绝的未来主义海滨别墅“奇想岛”。别墅内充满了智能家居和监控设备。规则核心是“人气排名”，每周人气末位的嘉宾将失去一次约会选择权，这直接影响到他们与心动对象的互动，也与他们的秘密任务息息相关。",
      "core_conflict": "公开的浪漫追求与隐藏的个人任务之间的冲突。每个角色都需要在追求心动对象的同时，不择手段地完成自己的秘密任务，这导致了他们行为的矛盾与不可预测性，充满了表演、欺骗和结盟。"
    },
    "character_pool": [
      {
        "character_name": "凌肖",
        "public_identity": "23岁，新锐艺术家",
        "secret_objective": "找到能理解他艺术的“缪斯”，并为她创作一幅专属作品。",
        "personality_tags": [
          "高冷",
          "毒舌",
          "理想主义",
          "精神洁癖"
        ],
        "initial_relationships": "对纪繁星的刻意感到厌烦；对顾远的“阳光”不置可否；对秦岚能捕捉到自己不易察觉的情绪变化而感到一丝兴趣。"
      },
      {
        "character_name": "顾远",
        "public_identity": "25岁，科技公司CEO",
        "secret_objective": "在不刻意讨好的前提下，成为本季公认的“人气王”。",
        "personality_tags": [
          "阳光",
          "犬系男友",
          "高情商",
          "隐藏的掌控欲"
        ],
        "initial_relationships": "对纪繁星的第一印象很好，符合他心中“可爱女生”的形象；认为凌肖难以相处，是潜在的竞争对手；觉得秦岚过于安静，需要自己去“温暖”。"
      },
      {
        "character_name": "纪繁星",
        "public_identity": "22岁，时尚美妆博主",
        "secret_objective": "成为本季的“CP女王”，让至少两位男嘉宾为自己倾心。",
        "personality_tags": [
          "甜美",
          "交际花",
          "目标导向",
          "表演型人格"
        ],
        "initial_relationships": "将顾远视为首要攻略目标；对凌肖的无视感到恼火和不甘；对秦岚的敏锐感到忌惮，视其为潜在威胁。"
      },
      {
        "character_name": "秦岚",
        "public_identity": "24岁，悬疑小说家",
        "secret_objective": "将本次经历改编为畅销小说，为此需要搜集到最真实、最劲爆的素材。",
        "personality_tags": [
          "敏锐",
          "观察家",
          "腹黑",
          "冷静"
        ],
        "initial_relationships": "对所有人都没有恋爱的兴趣，视他们为小说角色：纪繁星是“虚伪的女主”，顾远是“中央空调式的男主”，凌肖是“难以预测的X因素”。"
      }
    ],
    "display_chapter_one_script": {
      "comment": "第一章剧本。AI的行为应参考玩家在opening_choices中的选择。",
      "narrative_block": [
        {
          "sound_effects": ["dreamy_pop_music.mp3", "ocean_waves.mp3", "camera_shutters.mp3"],
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(1).jpg",
          "visual_effects": ["slow-motion-entrance", "character-name-card-overlay"],
          "dialogues": [
            { "speaker": "纪繁星", "text": "（第一个出场，高跟鞋'不小心'在门口崴了一下）哎呀！" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(2).jpg",
          "dialogues": [
            { "speaker": "顾远", "text": "（第二个出场，立刻上前扶住）小心！你没事吧？" },
            { "speaker": "【观察室-偶像帅哥】", "text": "哇哦~经典永流传！这不就是命运般的相遇吗！" },
            { "speaker": "【观察室-犀利姐】", "text": "（喝了口水）我赌五毛，这一下是设计好的。你看她摔倒的方向，正好是摄像机的黄金角度，而且倒下的姿势完美避开了走光风险，这是专业素养。" }
          ]
        },
        {
          "sound_effects": ["indie_rock_music_fade_in.mp3"],
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(4).jpg",
          "visual_effects": ["split-screen-of-their-observant-eyes"],
          "dialogues": [
            { "speaker": "旁白", "text": "随后，艺术家凌肖和作家秦岚也抵达了。秦岚看到门口那一幕，嘴角扬起一丝难以察觉的微笑，而这个微笑，恰好被对面的凌肖捕捉到了。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(4).jpg",
          "visual_effects": ["慢镜头给到秦岚的视线，从纪繁星的鞋跟，到她完美的表情，最后定格在她嘴角的微笑"],
          "dialogues": [
            { "speaker": "秦岚", "text": "（内心独白）有趣。定制款的坡跟鞋，最不容易崴脚的款式。第一幕戏，就这么开场了么。" },
            { "speaker": "【观察室-心理学家】", "text": "有意思。纪繁星在表演【利他性脆弱】，以激发男性的保护欲。顾远在入戏，他享受这种被需要的感觉。" }
          ]
        },
        {
          "sound_effects": ["soft_dinner_music.mp3", "cutlery_clinking.mp3", "subtle_tense_underscore.mp3"],
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(5).jpg",
          "visual_effects": ["candlelight-flickering"],
          "dialogues": [
            { "speaker": "旁白", "text": " 抵达小屋后的第一顿晚餐，精致的餐点也无法掩盖空气中的试探与审视。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(6).jpg",
          "visual_effects": ["close-up-on-subtle-expressions", "wine-swirling-in-glass"],
          "dialogues": [
            { "speaker": "顾远", "text": "（主动破冰）这里的环境真不错。大家平时休息时都喜欢做什么？我比较喜欢户外运动，像冲浪、攀岩之类的。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(7).jpg",
          "dialogues": [
            { "speaker": "纪繁星", "text": "（眼神发亮）哇，好酷！我正好想学冲浪，但总觉得一个人有点怕。不过我更喜欢看画展和逛美术馆啦，感觉能提升审美。" },
            { "speaker": "旁白", "text": "纪繁星说着，眼神不经意地瞟向了对面的凌肖。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(11).jpg",
          "dialogues": [
            { "speaker": "凌肖", "text": "商业画展那种地方，看到的只是商品，不是艺术。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(10).jpg",
          "dialogues": [
            { "speaker": "纪繁星", "text": "（笑容一僵）是、是吗……" },
            { "speaker": "【观察室-犀利姐】", "text": "来了来了，第一次交锋。纪繁星想一箭双雕，既迎合顾远又讨好凌肖，结果直接撞冰山上了。" }
          ]
        },
        {
          "sound_effects": ["dramatic_pause.mp3"],
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(3).jpg",
          "visual_effects": ["camera-focus-pulls-to-qinlan", "everyone-else-slightly-out-of-focus"],
          "dialogues": [
            { "speaker": "秦岚", "text": "（放下刀叉，微笑着看向众人）比起喜欢，我更好奇各位‘不喜欢’什么。不如我们聊聊，最无法忍受一个人身上的哪种特质？" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(6).jpg",
          "dialogues": [
            { "speaker": "顾远", "text": "（立刻回答）我最受不了'自私'吧。我觉得人与人之间，真诚和互相体谅是最重要的。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(10).jpg",
          "dialogues": [
            { "speaker": "纪繁星", "text": "（歪着头，意有所指地看了眼凌肖）我嘛……最讨厌那种故作高深、总把天聊死的人。生活已经很累了，为什么不能有趣一点呢？" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(11).jpg",
          "dialogues": [
            { "speaker": "凌肖", "text": "（放下刀叉，直视纪繁星）虚伪。" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(9).jpg",
          "dialogues": [
            { "speaker": "秦岚", "text": "（追问）只是虚伪吗？能具体一点吗？" }
          ]
        },
        {
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(11).jpg",
          "dialogues": [
            { "speaker": "凌肖", "text": "（目光转向秦岚，第一次有了正视）……以及，没有自知之明的试探。" },
            { "speaker": "【观察室-心理学家】", "text": "精彩！秦岚用一个问题，就让所有人都亮出了自己的武器和盾牌。而秦岚自己，却始终藏在问题背后，滴水不漏。" }
          ]
        },
        {
          "sound_effects": ["tense_music_swell.mp3"],
          "background_image": "https://pub-59c5b7bc6bab40acbede03c68de813a5.r2.dev/%E6%81%8B%E7%88%B1%E7%9C%9F%E4%BA%BA%E7%A7%80%E7%B4%A0%E6%9D%90%E5%88%B6%E4%BD%9C%20(13).jpg",
          "visual_effects": ["subtle-zoom-on-each-face"],
          "dialogues": [
            { "speaker": "旁白", "text": "晚餐在这样暗流涌动中结束。到了决定第一晚做决定的时刻——匿名心动短信。" }
          ],
          "decision_point": {
            "decision_id": "decision_group_01_first_text",
            "character_id": "ALL",
            "prompt": "第一晚的心动短信该发给谁？请所有玩家同时做出你的选择。",
            "options": [
              { "id": "text_lingxiao", "text": "发送给【凌肖】" },
              { "id": "text_guyuan", "text": "发送给【顾远】" },
              { "id": "text_fanxing", "text": "发送给【纪繁星】" },
              { "id": "text_qinlan", "text": "发送给【秦岚】" },
              { "id": "text_none", "text": "发送给【自己】(表示无人心动或保持神秘)" }
            ]
          },
          "audience_engagement_point": {
            "engagement_id": "engagement_001_popularity_king",
            "prompt_to_audience": "第一夜人气预测！你认为今晚哪位男生会成为得票最多的人气王？",
            "options": [
              { "id": "bet_guyuan", "text": "押注【顾远】，阳光暖男" },
              { "id": "bet_fanxing", "text": "押注【纪繁星】，甜美无害" }
            ]
          }
        }
      ],
      "updated_character_states": [
        { "id": "顾远", "status_change": { "mood": "Slightly Unsettled", "thought": "气氛有点紧张，但繁星好像对我印象不错，先稳住。" } },
        { "id": "纪繁星", "status_change": { "mood": "Frustrated & Strategic", "thought": "凌肖真是块又臭又硬的石头！看来得改变策略，先从他身边的人下手。" } },
        { "id": "凌肖", "status_change": { "mood": "Intrigued & Annoyed", "thought": "那个叫秦岚的女人有点意思。另一个，像一只聒噪的鹦鹉。" } },
        { "id": "秦岚", "status_change": { "mood": "Analytical", "thought": "人物关系初步建立：顾远是秩序维护者，纪繁星是麻烦制造者，凌肖是潜在的爆发点。我的故事，有雏形了。" } }
      ]
    }
  }
};

async function uploadToFirestore() {
  try {
    const docRef = db.collection('livestory').doc("Heartbeat").set(HeartbeatData);
    console.log('上传成功！');
  } catch (error) {
    console.error('上传失败：', error);
  }
}

uploadToFirestore();



