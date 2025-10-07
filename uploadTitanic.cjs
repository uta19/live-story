// npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.local.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 你的 narrative_block 数据
const titanicData = {
  "display_fields": {
    "Storyname": "甄嬛娘娘团登上泰坦尼克",
    "Storyimage": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/Generated%20Image%20September%2030%2C%202025%20-%2011_07PM.png",
    "category_tags": [
      "#宫斗",
      "#穿越"
    ],
    "synopsis": "当清朝后宫的娘娘们登上永不沉没的泰坦尼克号，一场跨越时空的宫斗大戏就此展开。在这艘钢铁巨轮上，她们的战场从红墙宫苑转移到了大西洋，旧的权谋规则与新的生存挑战激烈碰撞，谁能成为笑到最后的赢家？",
    "player_count": "5人",
    "estimated_playtime": "30-45分钟",
    "user_facing_content": {
      "character_setup": [
        {
          "character_name": "皇后",
          "description": "名义上的“董事长夫人”，雍容华贵但对一切都提不起兴趣。",
          "objective": "以最省力的方式维持自己不可动摇的地位，确保一切合乎规矩，并尽快结束这场\"商务旅行\"。"
        },
        {
          "character_name": "甄嬛",
          "description": "冷静、睿智的“项目经理”，总能用最专业的术语化解最棘手的宫斗难题。",
          "objective": "确保“皇家邮轮项目”顺利进行，提升团队（后宫）的整体形象与软实力。"
        },
        {
          "character_name": "华妃",
          "description": "气场强大的“顶流KOL”，时刻保持着精致的妆容和高傲的态度。",
          "objective": "成为全场的焦点，稳固自己最受宠的地位，打压任何潜在的竞争对手。"
        },
        {
          "character_name": "安陵容",
          "description": "出身卑微的“内卷学霸”，敏感而努力。",
          "objective": "努力学习新技能（如英语），提升自己的价值，在这趟旅程中站稳脚跟。"
        },
        {
          "character_name": "果郡王",
          "description": "一位身处三等舱的神秘青年艺术家，气质忧郁而浪漫。",
          "objective": "以旁观者的身份记录下这艘船上发生的一切，默默守护甄嬛。"
        }
      ],
      "opening_choices": [
        {
          "character_id": "皇后",
          "context": "作为名正言顺的六宫之主，你的地位无人能及，但你也深知树大招风。在这艘充满变数的西洋轮船上，你并不想卷入无谓的纷争。",
          "prompt": "面对这场注定不平静的航行，你选择用何种姿态来巩固自己的“正宫”地位？",
          "options": [
            {
              "id": "HQ_option_1",
              "strategy": "以静制动",
              "text": "保持超然姿态，不多言、不干涉，让她们去争斗。你的沉默本身就是一种权威。"
            },
            {
              "id": "HQ_option_2",
              "strategy": "敲山震虎",
              "text": "在合适的时机，不经意地敲打一下最嚣张的人（比如华妃），用合乎规矩的方式提醒所有人谁才是真正的主人。"
            },
            {
              "id": "HQ_option_3",
              "strategy": "恩威并施",
              "text": "适度拉拢有能力且懂规矩的人（比如甄嬛），同时与皇帝保持一致步调，展现你的宽容与智慧。"
            }
          ]
        },
        {
          "character_id": "甄嬛",
          "context": "作为整个“皇家邮轮项目”的实际管理者，你深知这次跨国旅行不仅是游玩，更是展现团队实力、巩固自身地位的关键。面对性格各异的团队成员，你的管理风格将决定一切。",
          "prompt": "登上泰坦尼克号，你的开局管理策略是？",
          "options": [
            {
              "id": "ZH_option_1",
              "strategy": "建立标准",
              "text": "第一时间明确团队目标和行为准则（SOP），用专业的制度和流程来管理所有人，树立自己不容置疑的权威。"
            },
            {
              "id": "ZH_option_2",
              "strategy": "静观其变",
              "text": "先不急于表现，低调观察各方动向，了解每个人的真实目的和潜在威胁，在关键时刻再出手干预。"
            },
            {
              "id": "ZH_option_3",
              "strategy": "团结弱势",
              "text": "主动关心和帮助像安陵容这样地位较低但有潜力的成员，建立自己的核心小团队，以应对未来的挑战。"
            }
          ]
        },
        {
          "character_id": "华妃",
          "context": "你天生就该是焦点。这艘号称世界之最的巨轮，不过是你展示魅力的新舞台。你绝不允许任何人抢走你的风头。",
          "prompt": "在这场备受瞩目的航行中，你打算如何闪耀全场？",
          "options": [
            {
              "id": "HF_option_1",
              "strategy": "高调示威",
              "text": "从登船第一刻起就展示自己的奢华行头和尊贵地位，给所有人一个下马威，让他们明白谁才是主角。"
            },
            {
              "id": "HF_option_2",
              "strategy": "制造话题",
              "text": "主动挑起一些小冲突或戏剧性事件，让自己时刻处于舆论中心，享受被议论和关注的感觉。"
            },
            {
              "id": "HF_option_3",
              "strategy": "笼络权贵",
              "text": "专注于结交船上的西方上流社会人士，利用自己的东方魅力打开新的社交圈，从更高维度碾压竞争者。"
            }
          ]
        }
      ]
    },
    "model_facing_content": {
      "global_story_background": {
        "prologue": "故事发生在一个架空的宇宙。大清并未覆灭，而是转型为一个神秘而强大的东方商业帝国。皇帝，作为帝国的掌舵人，决定开启一项名为“皇家邮轮”的跨文化交流项目，旨在考察西方工业革命的成果，并展现帝国的“软实力”。为此，他包下了泰坦尼克号的部分头等舱，带领他的“核心管理层”——即后宫众人，踏上了这次前往美国的商务旅行。",
        "setting": "故事的核心场景是1912年的泰坦尼克号。这艘船本身就是一个等级森严的微缩社会，头等舱的奢华与三等舱的拥挤形成鲜明对比。船上的乘客来自世界各地，东西方文化在此碰撞，传统礼仪与现代观念交织，为宫斗戏码提供了充满变数的舞台。",
        "core_conflict": "核心冲突在于，后宫成员们将她们在紫禁城中的权力斗争模式，几乎原封不动地带到了这艘西方的巨轮上。她们争夺的不仅仅是皇帝的关注，还有在这个新环境下的地位、话语权和生存空间。旧的宫斗手段在新的规则体系下面临失效的风险，每个人都必须适应和进化。"
      },
      "character_pool": [
        {
          "character_name": "皇后",
          "public_identity": "东方商业帝国的“第一夫人”，所有女性家眷名义上的最高领导。",
          "secret_objective": "对此次“团建”毫无兴趣，唯一的目的就是安稳地维持住自己的体面和地位，不出任何差错。她希望尽快结束旅程，回到自己熟悉且舒适的环境中去。",
          "personality_tags": [
            "端庄",
            "疲惫",
            "守旧",
            "地位至上"
          ],
          "initial_relationships": "认为华妃张扬跋扈，有失体统；认为甄嬛过于精明，野心不小，需加以留意；对安陵容这类角色几乎毫无印象，视若无物。"
        },
        {
          "character_name": "甄嬛",
          "public_identity": "皇家邮轮项目的总负责人，相当于皇帝的“执行总裁”。",
          "secret_objective": "利用项目经理的身份，建立超越后宫位份的实际权力，并借机考察皇帝在海外的商业布局，为自己和家族的未来铺路。",
          "personality_tags": [
            "战略家",
            "冷静克制",
            "善于观察",
            "结果导向"
          ],
          "initial_relationships": "视华妃为项目推进的最大障碍和潜在风险；视安陵容为一颗需要引导和扶持的棋子；对皇后保持表面尊重，实则暗中观察；尚未注意到果郡王的存在。"
        },
        {
          "character_name": "华妃",
          "public_identity": "皇帝最宠爱的“品牌代言人”，负责团队的“时尚与形象”。",
          "secret_objective": "确保自己是皇帝唯一的宠爱，杜绝任何新人上位的可能性。她认为这次旅行是巩固自己地位，并让家族势力延伸至海外的绝佳机会。",
          "personality_tags": [
            "骄傲自负",
            "追求瞩目",
            "情绪化",
            "缺乏安全感"
          ],
          "initial_relationships": "极度鄙视和敌视甄嬛，认为她在挑战自己的权威；轻视安陵容，将其视为可以随意拿捏的蝼蚁；嫉妒皇后的正统地位。"
        },
        {
          "character_name": "安陵容",
          "public_identity": "团队中的“实习生”或初级助理，负责一些琐碎的事务。",
          "secret_objective": "在这趟旅程中拼命学习一切有用的知识和技能，摆脱自己“工具人”的命运，获得真正的尊重和一席之地，为此可以依附于任何强者。",
          "personality_tags": [
            "勤奋上进",
            "自卑敏感",
            "渴望认可",
            "坚韧"
          ],
          "initial_relationships": "惧怕华妃的霸凌；仰慕并希望依靠甄嬛的智慧和能力；对高高在上的皇后和皇帝敬而远之。"
        },
        {
          "character_name": "果郡王",
          "public_identity": "一位购买了三等舱船票的流浪画家，对外身份与皇室无任何关联。",
          "secret_objective": "他其实是微服私访的皇室成员，厌倦了宫廷的虚伪和束缚，想借此机会体验真实的生活，并暗中观察皇帝的“核心管理层”在脱离紫禁城环境后的真实面目。",
          "personality_tags": [
            "理想主义",
            "艺术家气质",
            "叛逆",
            "洞察力强"
          ],
          "initial_relationships": "作为“隐形人”，他对头等舱的众人保持着纯粹的观察者视角，对他们之间的戏剧性冲突充满了艺术家的好奇与探究。"
        }
      ],
      "display_chapter_one_script": {
        "comment": "第一章剧本。AI的行为应参考玩家在opening_choices中的选择。",
        "narrative_block": [
          {
            "sound_effects": ["ship_horn_long_deep.mp3", "seagulls_crying.mp3", "bustling_crowd_chatter_early_20th_century.mp3", "upbeat_orchestral_music.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/2%20(1).jpeg",
            "visual_effects": ["epic-panoramic-shot", "lens-flare-sun", "text-overlay: '英国 南安普顿港 1912年4月10日'"],
            "dialogues": [
              {
                "speaker": "旁白",
                "text": "公元1912年，大西洋的另一端。工业革命的奇迹——泰坦尼克号，如同一座钢铁巨兽，静静地停靠在南安普顿港。一场跨越时代的荒诞旅行，即将鸣笛启航。"
              }
            ]
          },
          {
            "sound_effects": ["royal_fanfare_subtle.mp3", "respectful_hush_in_crowd.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/2%20(1).jpeg",
            "visual_effects": ["slight-slow-motion"],
            "dialogues": [
              {
                "speaker": "旁白",
                "text": "在万众瞩目下，皇上——这位来自东方的神秘商业大亨，携一众家眷登船。"
              }
            ]
          },
          {
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/3n%20(1).png",
            "visual_effects": ["focus-on-empress-bored-expression"],
            "dialogues": [
              {
                "speaker": "皇后",
                "text": "（对剪秋小声抱怨）这裙子真是勒得慌...本宫乏了，什么时候能进去喝下午茶？"
              }
            ]
          },
          {
            "sound_effects": ["press_camera_flashes_intense.mp3", "upbeat_pop_music_intro.mp3", "excited_gasps.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/4n%20(1).png",
            "visual_effects": ["spotlight-on-huafei", "instagram-live-overlay-effect", "sparkle-filter"],
            "dialogues": [
              {
                "speaker": "华妃",
                "text": "（仿佛自带BGM，对着并不存在的镜头挥手）宝宝们看过来！今天本宫这身look怎么样？一会儿的开船vlog，记得一键三连哦！"
              },
              {
                "speaker": "旁白",
                "text": "华妃完全把登船舷梯走成了戛纳红毯，成功吸引了全场的目光，除了……"
              }
            ]
          },
          {
            "sound_effects": ["awkward_silence.mp3", "nervous_stammering.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/5n%20(1).png",
            "visual_effects": ["zoom-in-on-anlingrong-sweating", "text-bubble-overlay: 'KPI+1'"],
            "dialogues": [
              {
                "speaker": "旁白",
                "text": "在角落里，安陵容正抓着一位英国管家，对照着小抄，磕磕巴巴地练习着她的“职场技能”。"
              },
              {
                "speaker": "安陵容",
                "text": "Hello... May I... may I ask... where is the... library? My Key... Performance... Indicator... today is to learn ten new English words."
              }
            ]
          },
          {
            "sound_effects": ["awkward_silence.mp3", "nervous_stammering.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/6n%20(1).png",
            "visual_effects": ["spotlight-on-huafei", "laugh-track-effect"],
            "dialogues": [
              {
                "speaker": "华妃",
                "text": "（恰好走过，发出一声嗤笑）哟，这不是安答应吗？怎么，还学上鸟语了？在本宫面前卖弄，你配吗？"
              }
            ],
            "audience_engagement_point": {
              "engagement_id": "engagement_001_first_clash",
              "engagement_type": "prediction_bet",
              "prompt_to_audience": "第一次正面交锋！你更看好谁的未来发展？",
              "options": [
                {
                  "id": "support_huafei",
                  "text": "顶流Drama Queen华妃"
                },
                {
                  "id": "support_anlingrong",
                  "text": "草根内卷王陵容"
                }
              ]
            }
          },
          {
            "sound_effects": ["calm_professional_voice.mp3", "record_scratch_sound_effect.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/7%20(1).png",
            "visual_effects": ["overlay-text: '项目经理 甄嬛 已上线'", "split-screen-huafei-confused-vs-zhenhuan-calm"],
            "dialogues": [
              {
                "speaker": "旁白",
                "text": "就在安陵容手足无措之时，一个沉稳的声音响起。"
              },
              {
                "speaker": "甄嬛",
                "text": "华妃娘娘，安答应正在进行'跨文化交流培训'，这是我们'皇家邮轮项目'软实力建设的一部分。公开场合的团队内耗，不利于展现我们的企业文化，是项目管理的大忌。"
              }
            ],
            "decision_point": {
              "decision_id": "decision_zhenhuan_001",
              "character_id": "甄嬛",
              "prompt": "我成功地用“职场黑话”镇住了场面，但华妃显然已被激怒。主子，我下一步应该如何操作，来最大化本次“危机干预”的成果？",
              "options": [
                {
                  "id": "option_A",
                  "text": "A.【升级对抗】继续输出，公开点明华妃此举对团队KPI的负面影响，彻底树立自己“项目经理”的权威。"
                },
                {
                  "id": "option_B",
                  "text": "B.【记录在案】“好记性不如烂笔头”，当着华妃的面，在小本本上记下一笔，用无声的方式进行威慑。"
                },
                {
                  "id": "option_C",
                  "text": "C.【团队建设】不理会华妃，转向安陵容，温和地说：“别紧张，稍后我们开个1 on 1，复盘一下今天的沟通要点。”"
                }
              ]
            }
          },
          {
            "sound_effects": ["camera_shutter_sound.mp3", "pencil_sketching_on_paper.mp3"],
            "background_image": "https://pub-2f9f2bb31dfe4cc7acd099657c4c879f.r2.dev/8%20(1).png",
            "visual_effects": ["fade-to-sepia-tone", "close-up-on-sketchbook-drawing-of-huafei-and-zhenhuan"],
            "dialogues": [
              {
                "speaker": "旁白",
                "text": "远在三等舱拥挤的人潮中，一位年轻的画家——果郡王，正用速写记录下这荒诞而真实的一幕。他的画笔，刚刚捕捉到头等舱两位女性第一次交锋的瞬间。"
              }
            ]
          }
        ],
        "updated_character_states": [
          {
            "id": "皇后",
            "status_change": {
              "mood": "Bored"
            }
          },
          {
            "id": "华妃",
            "status_change": {
              "mood": "Annoyed"
            }
          },
          {
            "id": "安陵容",
            "status_change": {
              "mood": "Relieved"
            }
          },
          {
            "id": "甄嬛",
            "status_change": {
              "mood": "Assertive"
            }
          }
        ]
      }
    }
  }
};

async function uploadToFirestore() {
  try {
    const docRef = db.collection('livestory').doc('泰坦尼克');
    await docRef.set(titanicData);
    console.log('上传成功！');
  } catch (error) {
    console.error('上传失败：', error);
  }
}

uploadToFirestore();


