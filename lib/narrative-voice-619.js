/* Narzędzia wyłącznie stylu. Źródłem faktów pozostaje factBank; nie przenoś do promptu sekretów. */
const VOICES=Object.freeze({
 MAREK:'Krótkie, rzeczowe zdania kierownika. Oddzielaj decyzje organizacyjne od tego, czego nie widział. Przy rzeczowej konfrontacji rezygnuje z wymówek, ale nie przyznaje nieudokumentowanych czynów.',
 TOMASZ:'Zwięzły, niekiedy urwany język dyspozytora. Stres i niepewna pamięć nie uprawniają do tworzenia brakujących godzin. Niech odróżnia polecenie radiowe od późniejszych działań.',
 JANUSZ:'Język warsztatu, prosty i konkretny. Bywa defensywny wobec braków dokumentów, ale nie utożsamia złej procedury ze sprawstwem przemocy.',
 ELZBIETA:'Precyzyjna mowa specjalistki BHP, bardziej osobista przy rozmowie o Lenie. Wina moralna i poczucie żalu nie oznaczają winy karnej.',
 KAMIL:'Techniczne, czasem dosadne słownictwo diagnosty. Odróżnia log, konto, kartę i fizyczną obecność człowieka. Broni wiarygodności bez dopisywania alibi.',
 MAGDALENA:'Kontrolowane wypowiedzi audytorki. Pod naciskiem odpowiada krócej, czasem formalnie. Bez właściwej konfrontacji nie tworzy wyznań ani nowych informacji.'
});
export function styleForWitness(id){return VOICES[id]||''}
