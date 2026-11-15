import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LEAD, SCENES } from "./timings";
import { Bullet, C, Card, DISPLAY, goldText, Icon, Reveal, SANS, SecChip, SERIF, StepHeader, TimerChip } from "./ui";

/** Frame (inside the scene) at which a given fraction of the voice-over is reached. */
const useVo = (i: number) => (p: number) => Math.round(LEAD + p * SCENES[i].voFrames);

const Voice: React.FC<{ i: number }> = ({ i }) => (
  <Sequence from={LEAD} layout="none">
    <Audio src={staticFile(SCENES[i].vo)} />
  </Sequence>
);

/** Text block anchored above the Instagram caption zone. */
const Lower: React.FC<{ children: React.ReactNode; bottom?: number }> = ({ children, bottom = 300 }) => (
  <div style={{ position: "absolute", left: 80, right: 80, bottom, display: "flex", flexDirection: "column" }}>{children}</div>
);

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 12, color: C.gold }}>{children}</div>
);

// 1 ─ Hook
export const Hook: React.FC = () => {
  const v = useVo(0);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phaseB = v(0.36);
  const outA = interpolate(frame, [phaseB - 6, phaseB + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = spring({ frame: frame - 4, fps, config: { damping: 9, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <Voice i={0} />
      <Lower bottom={290}>
        <div style={{ opacity: outA, position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <Reveal at={2}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 52, color: C.ink }}>Kisi apne ko police ne</div>
          </Reveal>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 250,
              lineHeight: "230px",
              color: C.red,
              scale: interpolate(pulse, [0, 1], [2.2, 1]),
              opacity: interpolate(pulse, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
              textShadow: "0 0 60px rgba(255,60,40,0.55), 0 12px 0 #5a0d08",
              transformOrigin: "0% 100%",
            }}
          >
            ARREST
          </div>
          <Reveal at={14}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 52, color: C.ink }}>kar liya hai?</div>
          </Reveal>
        </div>
        {frame >= phaseB - 6 ? (
          <div>
            <Reveal at={phaseB} from="zoom">
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: C.ink }}>Ghabraiye mat.</div>
            </Reveal>
            <Reveal at={v(0.5)}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 46, color: C.mute, marginTop: 10 }}>Aaj samjhiye, step-by-step —</div>
            </Reveal>
            <Reveal at={v(0.72)}>
              <div style={{ fontFamily: DISPLAY, fontSize: 170, lineHeight: "160px", marginTop: 10, ...goldText }}>BAIL</div>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: C.ink }}>kaise milti hai?</div>
            </Reveal>
          </div>
        ) : null}
      </Lower>
    </AbsoluteFill>
  );
};

// 2 ─ What is bail
export const WhatIsBail: React.FC = () => {
  const v = useVo(1);
  return (
    <AbsoluteFill>
      <Voice i={1} />
      <Lower>
        <Reveal at={2} from="left">
          <Kicker>BASICS</Kicker>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 96, color: C.ink, lineHeight: 1.05 }}>
            BAIL <span style={goldText}>kya hai?</span>
          </div>
        </Reveal>
        <Reveal at={v(0.06)} style={{ marginTop: 22 }}>
          <Card>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 46, lineHeight: 1.25, color: C.ink }}>
              Case chalte samay <span style={{ color: C.goldLight, fontWeight: 800 }}>jail se asthayi rihaai</span>
            </div>
          </Card>
        </Reveal>
        <Bullet at={v(0.35)} icon="doc">Bond / Bail Bond bharna</Bullet>
        <Bullet at={v(0.5)} icon="court">Har tareekh par court me haazri</Bullet>
        <Reveal at={v(0.76)} style={{ marginTop: 28 }}>
          <SecChip>Ab niyam: BNSS 2023</SecChip>
        </Reveal>
      </Lower>
    </AbsoluteFill>
  );
};

const TypeCard: React.FC<{ at: number; color: string; tag: string; line1: string; big: string; sec: string; from: "left" | "right" }> = ({
  at,
  color,
  tag,
  line1,
  big,
  sec,
  from,
}) => (
  <Reveal at={at} from={from} style={{ flex: 1 }}>
    <Card accent={color} style={{ padding: "30px 28px", minHeight: 400 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 64, color, letterSpacing: 2 }}>{tag}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, color: C.mute, marginTop: 8 }}>{line1}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 58, color: C.ink, lineHeight: 1.05, marginTop: 4 }}>{big}</div>
      <div style={{ marginTop: 26 }}>
        <SecChip color={color}>{sec}</SecChip>
      </div>
    </Card>
  </Reveal>
);

// 3 ─ Step 1
export const Step1: React.FC = () => {
  const v = useVo(2);
  return (
    <AbsoluteFill>
      <Voice i={2} />
      <Lower>
        <StepHeader n={1} title="Offence Pehchaniye" sub="Apraadh ki shreni" />
        <div style={{ display: "flex", gap: 28, marginTop: 30 }}>
          <TypeCard at={v(0.26)} from="left" color={C.green} tag="BAILABLE" line1="Bail =" big="Aapka ADHIKAAR" sec="Sec 478 BNSS" />
          <TypeCard at={v(0.64)} from="right" color={C.red} tag="NON-BAILABLE" line1="Bail =" big="Court ka VIVEK" sec="Sec 480 / 483" />
        </div>
      </Lower>
    </AbsoluteFill>
  );
};

// 4 ─ Step 2
export const Step2: React.FC = () => {
  const v = useVo(3);
  return (
    <AbsoluteFill>
      <Voice i={3} />
      <Lower>
        <StepHeader n={2} title="Arrest par Adhikaar" sub="Sec 47 & 58 BNSS" />
        <Bullet at={v(0.22)} icon="shield">
          Arrest ka <b style={{ color: C.goldLight }}>KAARAN</b> batana zaroori
        </Bullet>
        <Bullet at={v(0.42)} icon="doc">
          Bailable case me <b style={{ color: C.goldLight }}>bail ka adhikaar</b> batana
        </Bullet>
        <div style={{ marginTop: 26 }}>
          <TimerChip at={v(0.62)} value="24" unit="GHANTE" label="ke andar Magistrate ke saamne peshi (Sec 58)" />
        </div>
      </Lower>
    </AbsoluteFill>
  );
};

// 5 ─ Step 3
export const Step3: React.FC = () => {
  const v = useVo(4);
  return (
    <AbsoluteFill>
      <Voice i={4} />
      <Lower>
        <StepHeader n={3} title="Regular Bail" sub="Non-bailable case me" />
        <Bullet at={v(0.17)} icon="court">
          <div>Magistrate Court</div>
          <SecChip>Sec 480 BNSS</SecChip>
        </Bullet>
        <Bullet at={v(0.4)} icon="court">
          <div>Sessions / High Court</div>
          <SecChip>Sec 483 BNSS</SecChip>
        </Bullet>
        <Bullet at={v(0.72)} icon="eye">
          Court dekhti hai: <b style={{ color: C.goldLight }}>gambhirta & saboot</b>
        </Bullet>
      </Lower>
    </AbsoluteFill>
  );
};

// 6 ─ Step 4
export const Step4: React.FC = () => {
  const v = useVo(5);
  return (
    <AbsoluteFill>
      <Voice i={5} />
      <Lower>
        <StepHeader n={4} title="Anticipatory Bail" sub="Agrim Zamanat" />
        <Bullet at={v(0.26)} icon="warn" color={C.red}>
          Arrest ki <b style={{ color: "#ffb0a8" }}>AASHANKA</b> hai?
        </Bullet>
        <Reveal at={v(0.42)} from="zoom" style={{ marginTop: 26, alignSelf: "flex-start" }}>
          <SecChip>Sec 482 BNSS</SecChip>
        </Reveal>
        <Bullet at={v(0.62)} icon="court">
          Pehle hi <b style={{ color: C.goldLight }}>Sessions / High Court</b> me application
        </Bullet>
      </Lower>
    </AbsoluteFill>
  );
};

// 7 ─ Step 5
export const Step5: React.FC = () => {
  const v = useVo(6);
  return (
    <AbsoluteFill>
      <Voice i={6} />
      <Lower bottom={280}>
        <StepHeader n={5} title="Default Bail" sub="Sec 187(3) BNSS" />
        <Bullet at={v(0.16)} icon="doc">
          Chargesheet time par nahi = <b style={{ color: C.goldLight }}>bail ka adhikaar</b>
        </Bullet>
        <div style={{ display: "flex", gap: 24, marginTop: 26 }}>
          <div style={{ flex: 1 }}>
            <TimerChip compact at={v(0.55)} value="90" unit="DIN" label="Gambhir apraadh (10 saal+ / umrqaid / maut)" color={C.red} />
          </div>
          <div style={{ flex: 1 }}>
            <TimerChip compact at={v(0.72)} value="60" unit="DIN" label="Baaki sabhi apraadh" color={C.green} />
          </div>
        </div>
        <Reveal at={v(0.84)} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.goldLight, display: "flex", alignItems: "center", gap: 16 }}>
            <Icon name="clock" size={46} /> Application samay par dena zaroori
          </div>
        </Reveal>
      </Lower>
    </AbsoluteFill>
  );
};

// 8 ─ Step 6
export const Step6: React.FC = () => {
  const v = useVo(7);
  return (
    <AbsoluteFill>
      <Voice i={7} />
      <Lower>
        <StepHeader n={6} title="Bond & Sharten" sub="Bail milne ke baad" />
        <Bullet at={v(0.2)} icon="user">Bail Bond + Zamanatdaar (Surety)</Bullet>
        <Bullet at={v(0.5)} icon="clock">Har tareekh par haazri</Bullet>
        <Bullet at={v(0.66)} icon="eye">Gawahon se doori</Bullet>
        <Reveal at={v(0.8)} from="zoom" style={{ marginTop: 28 }}>
          <Card accent={C.red} style={{ padding: "22px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: SANS, fontWeight: 800, fontSize: 46, color: C.ink }}>
              <Icon name="warn" color={C.red} size={56} />
              Shart todi = <span style={{ color: C.red }}>Bail CANCEL</span>
            </div>
          </Card>
        </Reveal>
      </Lower>
    </AbsoluteFill>
  );
};

// 9 ─ Principle
export const Principle: React.FC = () => {
  const v = useVo(8);
  return (
    <AbsoluteFill>
      <Voice i={8} />
      <div style={{ position: "absolute", top: 250, left: 80, right: 80, textAlign: "center" }}>
        <Reveal at={2}>
          <Kicker>YAAD RAKHIYE</Kicker>
        </Reveal>
        <Reveal at={v(0.2)}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.mute, marginTop: 10 }}>Supreme Court ka siddhant</div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", bottom: 270, left: 60, right: 60, textAlign: "center" }}>
        <Reveal at={v(0.48)} from="zoom">
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: C.ink }}>
            <span style={goldText}>BAIL</span> niyam hai,
          </div>
        </Reveal>
        <Reveal at={v(0.74)} from="zoom">
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: C.ink, marginTop: 6 }}>
            <span style={{ color: C.red }}>JAIL</span> apvaad.
          </div>
        </Reveal>
        <Reveal at={v(0.95)}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontStyle: "italic", fontSize: 40, color: C.goldLight, marginTop: 18 }}>
            “Bail is the rule, jail is the exception.”
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

// 10 ─ Closing card (BCI-compliant: name, address, phone, disclaimer – no claims or solicitation)
export const Closing: React.FC = () => {
  const v = useVo(9);
  const frame = useCurrentFrame();
  const line = interpolate(frame, [20, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Voice i={9} />
      <Lower bottom={250}>
        <Reveal at={4} from="below">
          <Card style={{ padding: "50px 46px", textAlign: "center" }}>
            <Kicker>LEGAL AWARENESS</Kicker>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 72, lineHeight: 1.08, marginTop: 18, ...goldText }}>
              Mohammad Rafiq Azad
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 14, color: C.ink, marginTop: 8 }}>ADVOCATE</div>
            <div style={{ height: 2, margin: "28px auto", width: `${line * 80}%`, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.ink, lineHeight: 1.35 }}>
              Chamber No. 786 & 92
              <br />
              New Court, Jalandhar
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 50, color: C.goldLight, marginTop: 22 }}>Contact: 7009646869</div>
          </Card>
        </Reveal>
        <Reveal at={v(0.05)} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 30, lineHeight: 1.4, color: C.mute, textAlign: "center" }}>
            Disclaimer: Yeh video sirf legal awareness ke liye hai. Ise legal advice ya solicitation na samjhein. Har case ke tathya alag hote
            hain — apne case me kisi yogya advocate se salah lein.
          </div>
        </Reveal>
      </Lower>
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = [Hook, WhatIsBail, Step1, Step2, Step3, Step4, Step5, Step6, Principle, Closing];
