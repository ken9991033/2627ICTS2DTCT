/* ============================================================
 * content.js — 花階磚設計工作室：內容設定
 * ------------------------------------------------------------
 * 老師可以直接修改這個檔案：用家、顏色、產品尺寸、範例磚、
 * 意見選項、課堂流程……改完儲存，重新整理網頁就會生效。
 *
 * 用家訪問的答案可用 [[文字|需要代號]] 標記「需要」，
 * 學生點擊標記文字就會把該需要放進「需要收集箱」。
 * ============================================================ */
window.CONTENT = {
  appName: '花階磚設計工作室',
  school: '中二級 資訊及通訊科技科',

  /* 選項：sound 音效預設開／關；allowRandom 是否容許「隨機靈感」 */
  options: { sound: false, allowRandom: true },

  /* ---------- 顏料（花階磚傳統色） ---------- */
  palette: [
    { key: 'cream', name: '米白', hex: '#EEE6D3' },
    { key: 'grey', name: '水泥灰', hex: '#A8A59B' },
    { key: 'black', name: '炭黑', hex: '#2B2B29' },
    { key: 'red', name: '磚紅', hex: '#B03A2E' },
    { key: 'rose', name: '玫瑰粉', hex: '#DD9591' },
    { key: 'ochre', name: '芥末黃', hex: '#D6A036' },
    { key: 'green', name: '墨綠', hex: '#2F5E4E' },
    { key: 'mint', name: '薄荷綠', hex: '#8CC0A7' },
    { key: 'blue', name: '灰藍', hex: '#3E6D9C' },
    { key: 'sky', name: '天藍', hex: '#A2C8DF' }
  ],

  /* ---------- 3D 打印產品（尺寸單位：毫米） ----------
   * size：闊度／直徑；base：底座厚度；step：每一級凸起的高度 */
  products: {
    coaster: { name: '方形杯墊', size: 80, base: 2.4, step: 0.8, outline: 'square', roundedCorner: 8, tab: false, note: '80 × 80 mm，放得下茶杯' },
    mini: { name: '迷你磚', size: 40, base: 2.0, step: 0.6, outline: 'square', roundedCorner: 4, tab: false, note: '40 × 40 mm，打印快，可拼成全班地板' },
    keychain: { name: '鎖匙扣', size: 40, base: 2.4, step: 0.6, outline: 'square', roundedCorner: 4, tab: true, note: '40 × 40 mm，上方有掛孔' },
    round: { name: '圓形杯墊', size: 80, base: 2.4, step: 0.8, outline: 'circle', tab: false, note: '直徑 80 mm' },
    ornament: { name: '圓形掛飾', size: 60, base: 2.4, step: 0.8, outline: 'circle', tab: true, note: '直徑 60 mm，可做聖誕掛飾' }
  },

  /* ---------- 對稱方式（設計頁的快捷選擇） ---------- */
  symmetries: [
    { id: 'd4', name: '萬花筒', parts: '8 份', n: 4, mirror: true, hint: '畫好 1/8，電腦旋轉 4 次再鏡像' },
    { id: 'c4', name: '風車', parts: '4 份', n: 4, mirror: false, hint: '畫好 1/4，電腦旋轉 4 次' },
    { id: 'd2', name: '上下左右鏡像', parts: '4 份', n: 2, mirror: true, hint: '畫好 1/4，電腦左右上下翻轉' },
    { id: 'd1', name: '左右鏡像', parts: '2 份', n: 1, mirror: true, hint: '畫好一半，電腦左右翻轉' },
    { id: 'free', name: '自由', parts: '1 份', n: 1, mirror: false, hint: '不重複，全部自己畫' },
    { id: 'd6', name: '雪花', parts: '12 份', n: 6, mirror: true, roundOnly: true, hint: '圓形作品專用：旋轉 6 次再鏡像' },
    { id: 'd3', name: '三葉', parts: '6 份', n: 3, mirror: true, roundOnly: true, hint: '圓形作品專用：旋轉 3 次再鏡像' },
    { id: 'd8', name: '八瓣', parts: '16 份', n: 8, mirror: true, roundOnly: true, hint: '圓形作品專用：旋轉 8 次再鏡像' }
  ],

  /* ---------- 地板拼法 ---------- */
  floorRules: [
    { id: 'same', name: '全部同一方向', short: '同方向' },
    { id: 'alt', name: '隔一塊轉 90°', short: '隔塊旋轉' },
    { id: 'pinwheel', name: '四塊一組轉圈', short: '四塊轉圈' },
    { id: 'mirror', name: '隔行隔列鏡像', short: '鏡像拼' },
    { id: 'random', name: '隨機旋轉', short: '隨機' }
  ],

  /* ---------- 用家需要 ----------
   * auto：電腦可以自動檢查的項目；null 代表要由同學（扮演用家）判斷 */
  needs: {
    retro: { label: '懷舊花紋', icon: '🕰️', desc: '有舊式花階磚的味道', auto: null },
    contrast: { label: '顏色對比強', icon: '🌓', desc: '深淺分明，容易看清楚', auto: 'contrast' },
    large: { label: '夠大放得穩', icon: '☕', desc: '尺寸要放得下杯', auto: 'large' },
    clean: { label: '容易清潔', icon: '🧽', desc: '凸起不太高，污漬不易積聚', auto: 'clean' },
    bright: { label: '鮮豔吸睛', icon: '🌈', desc: '用幾種鮮明的顏色', auto: 'bright' },
    hkstyle: { label: '香港特色', icon: '🏙️', desc: '一看就想起香港', auto: null },
    quickprint: { label: '打印要快', icon: '⏱️', desc: '每件打印時間短', auto: 'quickprint' },
    small: { label: '細小輕便', icon: '🎒', desc: '細細件，方便攜帶', auto: 'small' },
    keyring: { label: '可以掛起', icon: '🔑', desc: '有孔可掛在鎖匙或書包', auto: 'keyring' },
    tileable: { label: '可拼成大圖', icon: '🧩', desc: '多塊拼起來，圖案會互相連接', auto: 'tileable' },
    limitedColors: { label: '少用顏色', icon: '🎨', desc: '整件作品只用 2–3 種顏色', auto: 'limitedColors' },
    meaning: { label: '有特別意義', icon: '💬', desc: '圖案背後有故事或訊息', auto: null },
    cute: { label: '可愛', icon: '⭐', desc: '小朋友會喜歡', auto: null },
    rounded: { label: '沒有尖角', icon: '⚪', desc: '邊角圓滑，安全', auto: 'rounded' },
    tactile: { label: '摸得出圖案', icon: '✋', desc: '凸起明顯，用手可以感受', auto: 'tactile' },
    simple: { label: '圖案簡單大塊', icon: '🔷', desc: '形狀少而大，容易辨認', auto: 'simple' }
  },

  /* ---------- 用家卡 ---------- */
  personas: [
    {
      id: 'granny', name: '陳婆婆', age: 82, avatar: '👵', tint: '#E9C9B6',
      role: '深水埗唐樓住客',
      intro: '在唐樓住了五十年。上年屋企翻新，舊花階磚全部被拆走，婆婆很掛念以前的地板。',
      product: 'coaster',
      interview: [
        { q: '婆婆，你平時會怎樣用杯墊？', a: '我每朝都沖杯熱茶，放喺茶几慢慢飲。杯墊要[[夠大，放得穩個茶杯|large]]呀。' },
        { q: '你記得以前屋企的地磚是怎樣的嗎？', a: '以前成個廳都係紅紅綠綠嘅花階磚，好靚㗎！翻新之後冇晒，如果杯墊有返[[以前嗰種懷舊花紋|retro]]就好喇。' },
        { q: '你看東西清楚嗎？', a: '年紀大，眼矇矇，[[顏色太淺我就睇唔清楚|contrast]]，要深淺分明先得。' },
        { q: '有甚麼是你不喜歡的？', a: '最怕啲罅隙藏住茶漬，[[要易抹、易清潔|clean]]。' },
        { q: '你喜歡甚麼顏色？', a: '紅色好意頭，綠色睇落舒服。我個孫仔話綠同紅好襯。' }
      ]
    },
    {
      id: 'cafe', name: '阿明', age: 38, avatar: '👨‍🍳', tint: '#F1D79B',
      role: '油麻地茶餐廳第二代老闆',
      intro: '茶餐廳開業四十年，地下仍然是原裝花階磚。阿明想做一批新杯墊，吸引年輕人來打卡。',
      product: 'coaster',
      interview: [
        { q: '為甚麼想要新杯墊？', a: '後生仔最鍾意影相打卡，杯墊要[[顏色鮮豔、夠吸睛|bright]]，先會被人影入鏡！' },
        { q: '你的餐廳有甚麼特色？', a: '我哋地下仲係四十年前嘅花階磚，我想杯墊[[一睇就知係香港特色|hkstyle]]，同間舖夾。' },
        { q: '杯墊每日會怎樣使用？', a: '茶餐廳好忙，每日洗幾十次，[[凸起唔好太高，要易清潔|clean]]。' },
        { q: '你需要多少個？', a: '每張枱兩個，大約六十個，所以[[打印要快|quickprint]]啲，唔係等到聖誕都未有。' },
        { q: '尺寸方面呢？', a: '凍檸茶杯好大隻，杯墊[[要夠大|large]]。' }
      ]
    },
    {
      id: 'tourist', name: 'Sophie', age: 24, avatar: '🧳', tint: '#C9DDEA',
      role: '英國來港交換生',
      intro: '在香港讀了一年書，下個月回國。她想帶一件有香港特色的手信給家人。',
      product: 'keychain',
      interview: [
        { q: '你想買甚麼手信？', a: '我好鍾意舊樓啲花階磚，[[好有香港特色|hkstyle]]！我想帶返英國。' },
        { q: '手信有甚麼要求？', a: '我個行李箱已經好滿，[[要細細件、好輕|small]]。' },
        { q: '你會怎樣使用？', a: '我想[[掛喺背包或者鎖匙度|keyring]]，日日見到，就會記起香港。' },
        { q: '你喜歡甚麼顏色？', a: '[[鮮豔啲嘅顏色|bright]]！好似香港啲霓虹燈咁。' },
        { q: '你會送給誰？', a: '送俾媽媽同細佬，佢哋未嚟過香港，我想同佢哋分享呢度嘅故事。' }
      ]
    },
    {
      id: 'teacher', name: '何老師', age: 45, avatar: '🧑‍🏫', tint: '#D5CDEA',
      role: '學校開放日負責老師',
      intro: '開放日要送紀念品給嘉賓和小六同學，並在禮堂展示全校同學的作品。',
      product: 'mini',
      interview: [
        { q: '紀念品有甚麼用途？', a: '我哋想[[所有紀念品可以拼埋一齊，砌成一幅大圖|tileable]]，喺禮堂展覽。' },
        { q: '需要多少件？', a: '大約一百件，但學校只有一部 3D 打印機，所以[[每件都要打印得快|quickprint]]。' },
        { q: '顏色有要求嗎？', a: '打印機換色好麻煩，[[最好只用兩至三隻顏色|limitedColors]]。' },
        { q: '尺寸方面呢？', a: '[[細細件|small]]，方便小朋友帶走。' },
        { q: '想表達甚麼訊息？', a: '想表達[[同學之間互相連繫、團結|meaning]]嘅精神，好似一塊塊磚砌成一幅地板咁。' }
      ]
    },
    {
      id: 'kid', name: '小樂', age: 7, avatar: '🧒', tint: '#F4C6D0',
      role: '小一學生（和媽媽一起）',
      intro: '小樂每晚都喝朱古力奶。媽媽想為他做一個屬於自己的兒童杯墊。',
      product: 'round',
      interview: [
        { q: '小樂，你喜歡甚麼圖案？', a: '我鍾意星星同埋心心！要[[好可愛|cute]]！' },
        { q: '媽媽，你擔心甚麼？', a: '佢成日攞啲嘢周圍玩，[[唔可以有尖角|rounded]]，一定要安全。' },
        { q: '杯墊用來做甚麼？', a: '佢飲朱古力奶用，杯墊要[[夠大放得穩個杯|large]]。' },
        { q: '小樂，你喜歡甚麼顏色？', a: '[[好多好多顏色|bright]]！好似彩虹咁！' },
        { q: '還有甚麼想法嗎？', a: '媽媽：佢好鍾意用手指摸凹凹凸凸嘅嘢，[[摸落有趣|tactile]]就更好。' }
      ]
    },
    {
      id: 'vision', name: '黃先生', age: 50, avatar: '🧑‍🦯', tint: '#CFE3D4',
      role: '視障人士、喜歡品茶',
      intro: '黃先生因病失去大部分視力，但仍然很喜歡品茶。他希望可以用手「看」到杯墊上的花紋。',
      product: 'coaster',
      interview: [
        { q: '你怎樣分辨不同的杯墊？', a: '我主要靠手指摸，所以[[花紋一定要凸起明顯|tactile]]。' },
        { q: '甚麼圖案最容易摸得出？', a: '[[簡單、大塊嘅圖案|simple]]最好，太細嘅花紋摸落會糊成一片。' },
        { q: '有甚麼要小心？', a: '[[尖角會刮手|rounded]]，邊位最好圓啲。' },
        { q: '顏色對你有用嗎？', a: '我仲有少少光感，[[黑白對比強|contrast]]嘅顏色我都分到少少。' },
        { q: '你希望杯墊有甚麼意思？', a: '我太太以前屋企都係花階磚，佢成日話好靚。我想[[同佢分享呢份回憶|meaning]]。' }
      ]
    }
  ],

  /* ---------- 定義問題 ---------- */
  styles: ['懷舊', '鮮豔', '簡約', '可愛', '優雅', '大膽', '大自然', '幾何'],

  /* ---------- 同學測試：意見選項 ---------- */
  feedback: {
    praise: ['顏色配搭好看', '圖案有心思', '很有懷舊感', '很可愛', '對稱很整齊', '拼成地板很好看', '很適合用家', '摸起來應該很有趣'],
    suggest: ['顏色對比可以更強', '可以少用一些顏色', '圖案可以簡單一點', '圖案可以豐富一點', '中間可以加一個重點', '可以加邊框', '凸起可以高一點', '凸起可以低一點', '尺寸可以改一改', '邊角可以圓一點']
  },
  changes: ['改了顏色', '改了大小', '加了圖案', '刪了圖案', '改了位置或角度', '改了對稱方法', '改了凸起高度', '改了產品款式'],
  learned: ['把大問題拆解成小部分', '找出重複的圖案（模式）', '用迴圈重複圖案', '用「如果」決定地板排法', '從用家的角度思考', '根據意見改良設計', '把顏色轉成高度（抽象化）'],
  declarations: [
    { id: 'preset', text: '我以範例磚作為起點' },
    { id: 'random', text: '我使用了「靈感」隨機產生器' },
    { id: 'peer', text: '我參考了同學的意見' },
    { id: 'own', text: '圖案由我自己構思及設計' }
  ],

  /* ---------- 範例磚 ---------- */
  presets: [
    {
      id: 'redflower', name: '紅花地磚',
      design: {
        bg: 'cream', algo: { n: 4, mirror: true }, product: 'coaster', floorRule: 'same',
        shapes: [
          { type: 'bar', x: 0, y: -92, size: 100, sx: 0.2, rot: 90, color: 'red' },
          { type: 'ring', x: 100, y: -100, size: 46, sx: 1, rot: 0, color: 'ochre' },
          { type: 'circle', x: 100, y: -100, size: 25, sx: 1, rot: 0, color: 'green' },
          { type: 'petal', x: 0, y: -36, size: 28, sx: 1, rot: 0, color: 'red' },
          { type: 'leaf', x: 30, y: -30, size: 19, sx: 0.85, rot: 45, color: 'green' },
          { type: 'circle', x: 0, y: 0, size: 13, sx: 1, rot: 0, color: 'ochre' },
          { type: 'circle', x: 0, y: 0, size: 5, sx: 1, rot: 0, color: 'red' },
          { type: 'diamond', x: 0, y: -76, size: 9, sx: 1, rot: 0, color: 'green' },
          { type: 'circle', x: 56, y: -56, size: 5, sx: 1, rot: 0, color: 'red' }
        ]
      }
    },
    {
      id: 'pinwheel', name: '綠葉風車',
      design: {
        bg: 'cream', algo: { n: 4, mirror: false }, product: 'coaster', floorRule: 'same',
        shapes: [
          { type: 'circle', x: 100, y: -100, size: 34, sx: 1, rot: 0, color: 'mint' },
          { type: 'leaf', x: 26, y: -44, size: 32, sx: 0.78, rot: 32, color: 'green' },
          { type: 'petal', x: 58, y: -12, size: 16, sx: 1, rot: 100, color: 'ochre' },
          { type: 'circle', x: 0, y: 0, size: 14, sx: 1, rot: 0, color: 'ochre' },
          { type: 'star4', x: 0, y: 0, size: 11, sx: 1, rot: 45, color: 'green' },
          { type: 'circle', x: 70, y: -70, size: 6, sx: 1, rot: 0, color: 'green' }
        ]
      }
    },
    {
      id: 'bluestar', name: '藍白八角星',
      design: {
        bg: 'cream', algo: { n: 4, mirror: true }, product: 'coaster', floorRule: 'same',
        shapes: [
          { type: 'square', x: 100, y: -100, size: 34, sx: 1, rot: 45, color: 'blue' },
          { type: 'square', x: 100, y: -100, size: 18, sx: 1, rot: 45, color: 'cream' },
          { type: 'star8', x: 0, y: 0, size: 46, sx: 1, rot: 0, color: 'blue' },
          { type: 'star8', x: 0, y: 0, size: 32, sx: 1, rot: 22.5, color: 'cream' },
          { type: 'circle', x: 0, y: 0, size: 12, sx: 1, rot: 0, color: 'blue' },
          { type: 'diamond', x: 0, y: -74, size: 16, sx: 1, rot: 0, color: 'sky' },
          { type: 'bar', x: 0, y: -94, size: 100, sx: 0.12, rot: 90, color: 'blue' }
        ]
      }
    },
    {
      id: 'scallop', name: '粉紅扇貝',
      design: {
        bg: 'rose', algo: { n: 4, mirror: true }, product: 'coaster', floorRule: 'same',
        shapes: [
          { type: 'arch', x: 0, y: -90, size: 22, sx: 1, rot: 180, color: 'cream' },
          { type: 'arch', x: 52, y: -90, size: 22, sx: 1, rot: 180, color: 'cream' },
          { type: 'circle', x: 100, y: -100, size: 20, sx: 1, rot: 0, color: 'green' },
          { type: 'flower', x: 0, y: 0, size: 34, sx: 1, rot: 45, color: 'cream' },
          { type: 'flower', x: 0, y: 0, size: 18, sx: 1, rot: 0, color: 'green' },
          { type: 'circle', x: 0, y: 0, size: 6, sx: 1, rot: 0, color: 'ochre' },
          { type: 'leaf', x: 38, y: -38, size: 16, sx: 0.8, rot: 45, color: 'green' }
        ]
      }
    },
    {
      id: 'truchet', name: '彎彎曲線',
      design: {
        bg: 'cream', algo: { n: 1, mirror: false }, product: 'coaster', floorRule: 'random',
        shapes: [
          { type: 'ring', x: -100, y: -100, size: 118, sx: 1, rot: 0, color: 'green' },
          { type: 'ring', x: 100, y: 100, size: 118, sx: 1, rot: 0, color: 'green' },
          { type: 'circle', x: 100, y: -100, size: 16, sx: 1, rot: 0, color: 'ochre' },
          { type: 'circle', x: -100, y: 100, size: 16, sx: 1, rot: 0, color: 'ochre' }
        ]
      }
    },
    {
      id: 'arc', name: '單弧線',
      design: {
        bg: 'cream', algo: { n: 1, mirror: false }, product: 'coaster', floorRule: 'pinwheel',
        shapes: [
          { type: 'ring', x: 100, y: 100, size: 118, sx: 1, rot: 0, color: 'green' },
          { type: 'circle', x: -100, y: -100, size: 22, sx: 1, rot: 0, color: 'ochre' }
        ]
      }
    },
    {
      id: 'snow', name: '雪花掛飾',
      design: {
        bg: 'sky', algo: { n: 6, mirror: true }, product: 'ornament', floorRule: 'same',
        shapes: [
          { type: 'bar', x: 0, y: -45, size: 45, sx: 0.4, rot: 0, color: 'cream' },
          { type: 'leaf', x: 14, y: -62, size: 14, sx: 0.6, rot: 40, color: 'cream' },
          { type: 'diamond', x: 0, y: -86, size: 11, sx: 1, rot: 0, color: 'cream' },
          { type: 'star8', x: 0, y: 0, size: 18, sx: 1, rot: 0, color: 'blue' },
          { type: 'circle', x: 0, y: 0, size: 7, sx: 1, rot: 0, color: 'cream' }
        ]
      }
    }
  ],

  /* ---------- 演算法挑戰 ---------- */
  algoChallenges: [
    { id: 'pin', title: '挑戰 1：風車磚', goal: '只用旋轉，做出 4 片「風車」。', target: { n: 4, angle: 90, mirror: false }, start: { n: 1, angle: 0, mirror: false } },
    { id: 'kal', title: '挑戰 2：萬花筒磚', goal: '加上鏡像，做出 8 份對稱的花階磚。', target: { n: 4, angle: 90, mirror: true }, start: { n: 4, angle: 90, mirror: false } },
    { id: 'bug', title: '挑戰 3：捉蟲', goal: '這段程式有錯，圖案轉不回原位。請修正它！', target: { n: 4, angle: 90, mirror: true }, start: { n: 4, angle: 60, mirror: true } },
    { id: 'snow', title: '挑戰 4（延伸）：雪花', goal: '做出 6 片對稱的雪花。每次要轉幾度？', target: { n: 6, angle: 60, mirror: true }, start: { n: 4, angle: 90, mirror: true }, round: true, optional: true }
  ],
  floorChallenges: [
    { id: 'alt', title: '看圖找規則', goal: '用「單弧線」磚，右邊的地板用了哪一條規則？選一條，然後執行看看。', target: 'alt', tile: 'arc' },
    { id: 'pinwheel', title: '砌出大圓圈', goal: '用「單弧線」磚砌出右邊的大圓圈。哪一條規則做得到？', target: 'pinwheel', tile: 'arc' }
  ],

  /* ---------- 花階磚偵探：拆解大問題 ---------- */
  decompose: {
    branches: [
      { id: 'look', name: '圖案與顏色', desc: '看起來怎樣' },
      { id: 'build', name: '尺寸與打印', desc: '怎樣做出來' },
      { id: 'user', name: '用家感受', desc: '用家用起來怎樣' }
    ],
    cards: [
      { text: '揀 2–4 種顏色', branch: 'look' },
      { text: '設計 1/8 的基本圖案', branch: 'look' },
      { text: '決定用甚麼對稱方法', branch: 'look' },
      { text: '揀杯墊還是鎖匙扣', branch: 'build' },
      { text: '決定凸起有多高', branch: 'build' },
      { text: '估計打印要多久', branch: 'build' },
      { text: '請同學扮演用家試用', branch: 'user' },
      { text: '檢查有沒有做到用家的需要', branch: 'user' }
    ]
  },

  /* ---------- 教師：課堂流程（兩個雙連堂，每節 35 分鐘） ---------- */
  lessons: [
    {
      title: '課次 5｜設計與計算思維（一）', minutes: 70,
      goal: '觀察用家需要，定義具體問題；把問題拆解成可處理的小部分。',
      values: '同理心、尊重他人',
      blocks: [
        { t: 8, name: '引入', what: '首頁地板動畫、展示 3D 打印樣本；說明任務：為一位用家設計花階磚，再 3D 打印出來。' },
        { t: 14, name: '步驟 1 認識用家', what: '四人一組抽同一張用家卡，模擬訪問，每人收集最少 3 個需要；小組口頭分享。', step: 1 },
        { t: 8, name: '步驟 2 定義問題', what: '揀產品，排出 3 個最重要的需要，寫出「我們可以如何……？」', step: 2 },
        { t: 15, name: '步驟 3 花階磚偵探', what: '找出最小的重複單位（1/8、1/4）；把設計任務拆成三類小任務。', step: 3 },
        { t: 17, name: '步驟 4 演算法工作坊', what: '重複、旋轉、鏡像；捉蟲；地板的巢狀迴圈及「如果」。', step: 4 },
        { t: 8, name: '總結', what: '下載存檔（很重要！）；出口卡：迴圈、模式、拆解各舉一例。' }
      ]
    },
    {
      title: '課次 6｜設計與計算思維（二）', minutes: 70,
      goal: '構思方案並以原型表達；測試並改進方案。',
      values: '團結、承擔精神',
      blocks: [
        { t: 5, name: '重溫', what: '載入存檔，重溫用家需要及設計準則。' },
        { t: 25, name: '步驟 5 設計花階磚', what: '在基本區域設計圖案，檢查地板效果，儲存為 v1。', step: 5 },
        { t: 8, name: '步驟 6 3D 原型', what: '把顏色轉成高度，檢查尺寸、打印時間及太幼的部分。', step: 6 },
        { t: 17, name: '步驟 7 測試與改良', what: '與鄰座交換，扮演對方的用家給意見；按意見修改並儲存為 v2。', step: 7 },
        { t: 10, name: '步驟 8 作品卡', what: '完成反思及創作聲明，下載作品卡、STL 及存檔並提交。', step: 8 },
        { t: 5, name: '全班作品牆', what: '教師匯入全班存檔，展示「全班地板」，選出要打印的作品。' }
      ]
    }
  ],

  teacherTips: [
    '第一課完結前，提醒學生按「下載存檔」並上載到 Google Classroom／Teams；學校電腦重開後，瀏覽器內的自動儲存可能會被清除。',
    '「偵探」答案：紅花地磚的最小重複單位是 1/8；綠葉風車是 1/4（沒有鏡像對稱）。',
    '演算法捉蟲：4 × 60° = 240°，轉不夠一圈；改為 90°（360 ÷ 4）。延伸：雪花 360 ÷ 6 = 60°。',
    '地板挑戰：「看圖找規則」答案是「隔一塊轉 90°」；「砌出大圓圈」答案是「四塊一組轉圈」（「隔行隔列鏡像」砌出來也一樣，同樣算對：不同的演算法可以得到相同結果）。',
    '全班迷你磚（40 mm）約 8–12 分鐘一件；在教師模式可把多件合併成一個打印盤 STL。',
    '雙色打印：在切片軟件於「底座厚度」的高度加入暫停／換料，底座和凸起便會是兩種顏色。'
  ]
};
