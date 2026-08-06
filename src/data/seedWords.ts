import type { Difficulty, ExamType } from '../types';

export interface SeedWord {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleTranslation?: string;
  category: string;
  difficulty: Difficulty;
  examType: ExamType;
}

export const seedWords: SeedWord[] = [
  // 일상회화
  { word: 'ambitious', phonetic: '/æmˈbɪʃəs/', meaning: '야심 있는, 야망 찬', example: 'She is an ambitious young manager.', exampleTranslation: '그녀는 야심 찬 젊은 매니저이다.', category: '성격', difficulty: 'medium', examType: '일상회화' },
  { word: 'generous', phonetic: '/ˈdʒɛnərəs/', meaning: '관대한, 후한', example: 'He is generous with his time.', exampleTranslation: '그는 자신의 시간에 관대하다.', category: '성격', difficulty: 'easy', examType: '일상회화' },
  { word: 'reliable', phonetic: '/rɪˈlaɪəbl/', meaning: '믿을 수 있는', example: 'She is a reliable friend.', exampleTranslation: '그녀는 믿을 수 있는 친구이다.', category: '성격', difficulty: 'easy', examType: '일상회화' },
  { word: 'commute', phonetic: '/kəˈmjuːt/', meaning: '통근하다', example: 'I commute to work by train.', exampleTranslation: '나는 기차로 출퇴근한다.', category: '일상', difficulty: 'easy', examType: '일상회화' },
  { word: 'errand', phonetic: '/ˈɛrənd/', meaning: '심부름, 볼일', example: 'I have to run some errands today.', exampleTranslation: '오늘 볼일이 좀 있다.', category: '일상', difficulty: 'medium', examType: '일상회화' },
  { word: 'grocery', phonetic: '/ˈɡroʊsəri/', meaning: '식료품', example: 'We need to buy groceries.', exampleTranslation: '우리는 식료품을 사야 한다.', category: '일상', difficulty: 'easy', examType: '일상회화' },
  { word: 'exhausted', phonetic: '/ɪɡˈzɔːstɪd/', meaning: '몹시 지친', example: 'I was exhausted after the trip.', exampleTranslation: '나는 여행 후에 몹시 지쳤다.', category: '감정', difficulty: 'medium', examType: '일상회화' },
  { word: 'annoyed', phonetic: '/əˈnɔɪd/', meaning: '짜증 난', example: 'He looked annoyed by the noise.', exampleTranslation: '그는 그 소음에 짜증 난 것처럼 보였다.', category: '감정', difficulty: 'easy', examType: '일상회화' },
  { word: 'grateful', phonetic: '/ˈɡreɪtfəl/', meaning: '감사하는', example: 'I am grateful for your help.', exampleTranslation: '당신의 도움에 감사드립니다.', category: '감정', difficulty: 'easy', examType: '일상회화' },
  { word: 'reservation', phonetic: '/ˌrɛzərˈveɪʃən/', meaning: '예약', example: 'I made a reservation for two.', exampleTranslation: '두 명 예약을 했다.', category: '여행', difficulty: 'easy', examType: '일상회화' },
  { word: 'itinerary', phonetic: '/aɪˈtɪnərəri/', meaning: '여행 일정표', example: 'Our itinerary includes three cities.', exampleTranslation: '우리 여행 일정에는 세 도시가 포함된다.', category: '여행', difficulty: 'hard', examType: '일상회화' },
  { word: 'luggage', phonetic: '/ˈlʌɡɪdʒ/', meaning: '수하물, 짐', example: 'Please keep an eye on my luggage.', exampleTranslation: '제 짐을 좀 봐 주세요.', category: '여행', difficulty: 'easy', examType: '일상회화' },

  // TOEIC / 비즈니스
  { word: 'negotiate', phonetic: '/nɪˈɡoʊʃieɪt/', meaning: '협상하다', example: 'They negotiated a new contract.', exampleTranslation: '그들은 새로운 계약을 협상했다.', category: '비즈니스', difficulty: 'medium', examType: 'TOEIC' },
  { word: 'invoice', phonetic: '/ˈɪnvɔɪs/', meaning: '송장, 청구서', example: 'Please send the invoice by email.', exampleTranslation: '청구서를 이메일로 보내주세요.', category: '비즈니스', difficulty: 'medium', examType: 'TOEIC' },
  { word: 'candidate', phonetic: '/ˈkændɪdeɪt/', meaning: '후보자, 지원자', example: 'She is a strong candidate for the job.', exampleTranslation: '그녀는 그 직무에 유력한 후보자이다.', category: '비즈니스', difficulty: 'easy', examType: 'TOEIC' },
  { word: 'deadline', phonetic: '/ˈdɛdlaɪn/', meaning: '마감 기한', example: 'The deadline for the report is Friday.', exampleTranslation: '보고서 마감일은 금요일이다.', category: '비즈니스', difficulty: 'easy', examType: 'TOEIC' },
  { word: 'revenue', phonetic: '/ˈrɛvənuː/', meaning: '수익, 매출', example: 'The company reported higher revenue this year.', exampleTranslation: '그 회사는 올해 더 높은 매출을 보고했다.', category: '비즈니스', difficulty: 'medium', examType: 'TOEIC' },
  { word: 'inventory', phonetic: '/ˈɪnvəntɔːri/', meaning: '재고, 재고 목록', example: 'We need to check the inventory.', exampleTranslation: '재고를 확인해야 한다.', category: '비즈니스', difficulty: 'medium', examType: 'TOEIC' },
  { word: 'colleague', phonetic: '/ˈkɒliːɡ/', meaning: '동료', example: 'My colleague helped me with the project.', exampleTranslation: '내 동료가 그 프로젝트를 도와주었다.', category: '비즈니스', difficulty: 'easy', examType: 'TOEIC' },
  { word: 'productivity', phonetic: '/ˌproʊdʌkˈtɪvəti/', meaning: '생산성', example: 'The new tools improved productivity.', exampleTranslation: '새 도구들이 생산성을 향상시켰다.', category: '비즈니스', difficulty: 'medium', examType: 'TOEIC' },
  { word: 'compensation', phonetic: '/ˌkɒmpənˈseɪʃən/', meaning: '보상, 급여', example: 'The compensation package includes health insurance.', exampleTranslation: '보상 패키지에는 건강 보험이 포함된다.', category: '비즈니스', difficulty: 'hard', examType: 'TOEIC' },
  { word: 'merger', phonetic: '/ˈmɜːrdʒər/', meaning: '합병', example: 'The merger was completed last month.', exampleTranslation: '합병은 지난달에 완료되었다.', category: '비즈니스', difficulty: 'hard', examType: 'TOEIC' },

  // 수능/TOEFL 학술 어휘
  { word: 'phenomenon', phonetic: '/fəˈnɒmɪnən/', meaning: '현상', example: 'Global warming is a serious phenomenon.', exampleTranslation: '지구 온난화는 심각한 현상이다.', category: '학술', difficulty: 'hard', examType: '수능' },
  { word: 'hypothesis', phonetic: '/haɪˈpɒθəsɪs/', meaning: '가설', example: 'The scientist tested her hypothesis.', exampleTranslation: '그 과학자는 자신의 가설을 검증했다.', category: '학술', difficulty: 'hard', examType: '수능' },
  { word: 'inevitable', phonetic: '/ɪnˈɛvɪtəbl/', meaning: '피할 수 없는', example: 'Change is inevitable in life.', exampleTranslation: '삶에서 변화는 피할 수 없다.', category: '학술', difficulty: 'hard', examType: '수능' },
  { word: 'contradict', phonetic: '/ˌkɒntrəˈdɪkt/', meaning: '모순되다, 반박하다', example: 'His actions contradict his words.', exampleTranslation: '그의 행동은 그의 말과 모순된다.', category: '학술', difficulty: 'hard', examType: '수능' },
  { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', meaning: '축적하다, 쌓다', example: 'Dust accumulated on the shelf.', exampleTranslation: '선반에 먼지가 쌓였다.', category: '학술', difficulty: 'medium', examType: '수능' },
  { word: 'controversy', phonetic: '/ˈkɒntrəvɜːrsi/', meaning: '논란, 논쟁', example: 'The decision caused a lot of controversy.', exampleTranslation: '그 결정은 많은 논란을 일으켰다.', category: '학술', difficulty: 'medium', examType: '수능' },
  { word: 'perspective', phonetic: '/pərˈspɛktɪv/', meaning: '관점, 시각', example: 'Try to see it from her perspective.', exampleTranslation: '그녀의 관점에서 보려고 노력해봐.', category: '학술', difficulty: 'medium', examType: '수능' },
  { word: 'sustainable', phonetic: '/səˈsteɪnəbl/', meaning: '지속 가능한', example: 'We need sustainable energy sources.', exampleTranslation: '우리는 지속 가능한 에너지원이 필요하다.', category: '학술', difficulty: 'medium', examType: '수능' },
  { word: 'discrepancy', phonetic: '/dɪsˈkrɛpənsi/', meaning: '차이, 불일치', example: 'There is a discrepancy in the report.', exampleTranslation: '보고서에 불일치가 있다.', category: '학술', difficulty: 'hard', examType: 'TOEFL' },
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: '모호한', example: 'The instructions were ambiguous.', exampleTranslation: '그 지침은 모호했다.', category: '학술', difficulty: 'hard', examType: 'TOEFL' },
  { word: 'component', phonetic: '/kəmˈpoʊnənt/', meaning: '구성 요소', example: 'Trust is a key component of teamwork.', exampleTranslation: '신뢰는 팀워크의 핵심 구성 요소이다.', category: '학술', difficulty: 'medium', examType: 'TOEFL' },
  { word: 'implication', phonetic: '/ˌɪmplɪˈkeɪʃən/', meaning: '함축, 영향', example: 'The policy has serious implications.', exampleTranslation: '그 정책은 심각한 영향을 미친다.', category: '학술', difficulty: 'hard', examType: 'TOEFL' },

  // 공무원/시사
  { word: 'legislation', phonetic: '/ˌlɛdʒɪsˈleɪʃən/', meaning: '법률, 입법', example: 'New legislation was passed last week.', exampleTranslation: '지난주에 새로운 법률이 통과되었다.', category: '시사', difficulty: 'hard', examType: '공무원' },
  { word: 'regulation', phonetic: '/ˌrɛɡjəˈleɪʃən/', meaning: '규정, 규제', example: 'The company must follow safety regulations.', exampleTranslation: '그 회사는 안전 규정을 따라야 한다.', category: '시사', difficulty: 'medium', examType: '공무원' },
  { word: 'jurisdiction', phonetic: '/ˌdʒʊərɪsˈdɪkʃən/', meaning: '관할권', example: 'This case falls outside our jurisdiction.', exampleTranslation: '이 사건은 우리 관할권 밖이다.', category: '시사', difficulty: 'hard', examType: '공무원' },
  { word: 'municipality', phonetic: '/mjuːˌnɪsɪˈpæləti/', meaning: '지방 자치체', example: 'The municipality provides local services.', exampleTranslation: '지방 자치체는 지역 서비스를 제공한다.', category: '시사', difficulty: 'hard', examType: '공무원' },
  { word: 'welfare', phonetic: '/ˈwɛlfɛər/', meaning: '복지', example: 'The government increased welfare spending.', exampleTranslation: '정부는 복지 지출을 늘렸다.', category: '시사', difficulty: 'medium', examType: '공무원' },
  { word: 'infrastructure', phonetic: '/ˈɪnfrəstrʌktʃər/', meaning: '기반 시설', example: 'The city invested in new infrastructure.', exampleTranslation: '그 도시는 새로운 기반 시설에 투자했다.', category: '시사', difficulty: 'medium', examType: '공무원' },

  // 기타/기초
  { word: 'brave', phonetic: '/breɪv/', meaning: '용감한', example: 'The firefighter was very brave.', exampleTranslation: '그 소방관은 매우 용감했다.', category: '기초', difficulty: 'easy', examType: '기타' },
  { word: 'gentle', phonetic: '/ˈdʒɛntl/', meaning: '온화한, 부드러운', example: 'She has a gentle voice.', exampleTranslation: '그녀는 부드러운 목소리를 가졌다.', category: '기초', difficulty: 'easy', examType: '기타' },
  { word: 'curious', phonetic: '/ˈkjʊəriəs/', meaning: '호기심 많은', example: 'Children are naturally curious.', exampleTranslation: '아이들은 본래 호기심이 많다.', category: '기초', difficulty: 'easy', examType: '기타' },
  { word: 'stubborn', phonetic: '/ˈstʌbərn/', meaning: '고집 센', example: 'My grandfather is very stubborn.', exampleTranslation: '우리 할아버지는 매우 고집이 세다.', category: '기초', difficulty: 'medium', examType: '기타' },
  { word: 'fragile', phonetic: '/ˈfrædʒaɪl/', meaning: '깨지기 쉬운, 연약한', example: 'Please handle the glass, it is fragile.', exampleTranslation: '유리니까 조심해서 다뤄 주세요.', category: '기초', difficulty: 'medium', examType: '기타' },
  { word: 'humble', phonetic: '/ˈhʌmbl/', meaning: '겸손한', example: 'Despite his success, he remains humble.', exampleTranslation: '성공했음에도 그는 겸손함을 유지한다.', category: '기초', difficulty: 'medium', examType: '기타' },
];
