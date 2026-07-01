export const sourceUrl = "https://etf.allianzgi.com.tw/eventsite/00402A/index.html";

export const knowledge = [
  {
    title: "基金定位",
    text:
      "安聯美國科技領航主動式ETF基金，代號00402A，主軸是「只選科技強中強、主動領跑就是強」。活動頁說明：美國是科技主場，採用安聯獨家 QQQ+ 策略，精選科技強中強。"
  },
  {
    title: "三大策略",
    text:
      "活動頁以 Quick+、Qualified+、Quality+ 說明策略。Quick+ 強調布局早一步；Qualified+ 強調主動選強股；Quality+ 強調實戰搶先機，聚焦高集中重點持股與科技題材爆發力。"
  },
  {
    title: "主動式ETF特性",
    text:
      "本基金為主動式交易所交易基金，投資目標不是追蹤、模擬或複製特定指數表現，而是由公司依投資策略進行基金投資。"
  },
  {
    title: "投資方向",
    text:
      "本基金主要投資於美國科技領航產業之有價證券。活動頁強調科技題材輪動、科技巨頭之外仍有許多機會，以及主動加碼掌握加值機會。"
  },
  {
    title: "配息與收益平準金",
    text:
      "基金名稱標示配息來源可能為收益平準金。本基金並無保證收益及配息，配息可能由基金收益平準金支付，涉及由收益平準金支出的部分可能導致原始投資金額減損。每年配息為擬定頻率，實際配息金額與配息與否將視收益狀況、資產配置及市場變動而定。"
  },
  {
    title: "風險等級與主要風險",
    text:
      "活動頁揭露本基金風險報酬等級為 RR4。主要風險包括類股過度集中風險、產業景氣循環風險、流動性風險、外匯管制及匯率變動風險、投資地區政治社會或經濟變動風險、商品交易對手信用風險等。"
  },
  {
    title: "購買方式",
    text:
      "ETF買賣方式與一般股票相同。想買00402A，可洽詢證券商營業員並告知ETF代號00402A，或透過證券商電子交易輸入ETF代號00402A。"
  },
  {
    title: "銷售機構",
    text:
      "活動頁列出的證券銷售機構包括元大、永豐金、凱基、富邦、群益金鼎、華南永昌、統一、國泰、台新、國票、兆豐、玉山、中國信託。銀行通路列出 LINE Bank。"
  },
  {
    title: "上市與淨值提醒",
    text:
      "活動頁提到ETF掛牌上市後預計掛牌日為6/9。上市後將依臺灣證交所規定，於臺灣證券交易時間內提供盤中估計淨值供投資人參考；盤中估計淨值與實際淨值可能有誤差，實際淨值以公司最終公告每日淨值為準。"
  },
  {
    title: "客服資訊",
    text:
      "安聯證券投資信託股份有限公司地址為台北市104016中山北路2段42號8樓，客服專線為(02)8770-9828。"
  },
  {
    title: "重要警語",
    text:
      "本基金經金管會核准或同意生效，惟不表示絕無風險。基金經理公司以往績效不保證最低投資收益，投資人申購前應詳閱公開說明書。基金投資無存款保險、保險安定基金或其他相關保障機制，投資人須自負盈虧，最大損失可能為全部本金。"
  }
];

export function compactKnowledge() {
  return knowledge.map((item) => `【${item.title}】${item.text}`).join("\n");
}

export function keywordSearch(question) {
  const normalized = question.toLowerCase();
  const routeTerms = [
    { terms: ["追蹤", "指數", "主動式", "複製", "模擬"], title: "主動式ETF特性" },
    { terms: ["哪裡買", "哪裡可以買", "怎麼買", "購買", "申購", "交易", "券商", "銷售"], title: "購買方式" },
    { terms: ["銷售機構", "通路", "銀行", "證券商", "line bank"], title: "銷售機構" },
    { terms: ["風險", "rr4", "風險等級", "風險報酬"], title: "風險等級與主要風險" },
    { terms: ["配息", "收益平準金", "保證收益", "收益"], title: "配息與收益平準金" },
    { terms: ["客服", "電話", "地址", "聯絡"], title: "客服資訊" },
    { terms: ["策略", "qqq", "quick", "qualified", "quality"], title: "三大策略" },
    { terms: ["投資", "科技", "美國", "領航產業"], title: "投資方向" },
    { terms: ["上市", "掛牌", "淨值", "估計淨值"], title: "上市與淨值提醒" }
  ];
  const routed = routeTerms
    .filter((route) => route.terms.some((term) => normalized.includes(term.toLowerCase())))
    .map((route) => knowledge.find((item) => item.title === route.title))
    .filter(Boolean);

  const hits = knowledge.filter((item) => {
    const haystack = `${item.title} ${item.text}`.toLowerCase();
    return normalized
      .split(/[\s,，。？?！!、]+/)
      .filter((token) => token.length >= 2)
      .some((token) => haystack.includes(token));
  });

  return [...new Set([...routed, ...hits])].slice(0, 3);
}
