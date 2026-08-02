export const ONBOARDING_STEPS = [
  {
    title: "أهلاً بك في إمبراطورية باي!",
    text: "يا مرحب بك يا باشا في أرض الخصب والنماء! أنا عم شاهين، مستشارك في إمبراطورية باي. هنا الأرض لا تظلم شقياناً، ومجتمع Pi يثق في إدارتك. دي حتة أرض بلدي مجانية من ديوان الأراضي، يله نحط فيها أول طوبة!"
  },
  {
    title: "التفاعل والإنتاج السريع",
    text: "المزرعة البشواتية تبدأ بخطوة. خد أول محاصيلك وابتدي البناء. اضغط على أي مربع فاضي عشان تبني، واستمتع بإنتاج وادي النيل!"
  },
  {
    title: "الواقعية والإنذار المبكر",
    text: "خد بالك يا باشا.. الطيور والمواشي هنا كائنات حية مش مجرد صور! لو أهملت مكانهم هيمرضوا. عينك دايماً على عداد الصحة فوق كل حيوان."
  },
  {
    title: "التوسع ومحفظة Pi",
    text: "لما إنتاجك يزيد وتحب تبني معالم أضخم، هنحتاج نطلع ديوان الأراضي ونستأجر مساحات أوسع بمحفظة Pi. دلوقتي انطلق، السوق مستني بضاعتنا!"
  }
];

export const INITIAL_WORKERS = [
  { id: 'w1', name: 'الفلاح المصري', x: 2, y: 2, targetX: 6, targetY: 2, stamina: 85, status: 'walking' as const, image: '/farmer.png' },
  { id: 'w2', name: 'ساقي الماء', x: 5, y: 5, targetX: 1, targetY: 5, stamina: 90, status: 'walking' as const, image: '/worker_water.png' },
  { id: 'w3', name: 'الصبي المساعد', x: 3, y: 6, targetX: 6, targetY: 6, stamina: 75, status: 'walking' as const, image: '/worker_boy.png' },
  { id: 'w4', name: 'عم شاهين', x: 1, y: 1, targetX: 4, targetY: 4, stamina: 100, status: 'walking' as const, image: '/shaheen.png' }
];