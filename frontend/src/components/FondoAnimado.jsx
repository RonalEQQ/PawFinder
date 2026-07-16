import huellaImg from "../assets/huella.png"
import lupaImg   from "../assets/lupa.png"

const DECO_CSS = `
  @keyframes floatUD {
    0%,100% { transform: translateY(0px)   rotate(var(--r,0deg)); }
    40%     { transform: translateY(-18px)  rotate(calc(var(--r,0deg) + 6deg)); }
    70%     { transform: translateY(-10px)  rotate(calc(var(--r,0deg) - 4deg)); }
  }
  @keyframes floatLR {
    0%,100% { transform: translateX(0px)   rotate(var(--r,0deg)); }
    35%     { transform: translateX(14px)   rotate(calc(var(--r,0deg) + 5deg)); }
    70%     { transform: translateX(-8px)   rotate(calc(var(--r,0deg) - 3deg)); }
  }
  @keyframes floatDiag {
    0%,100% { transform: translate(0,0)          rotate(var(--r,0deg)); }
    33%     { transform: translate(12px,-16px)    rotate(calc(var(--r,0deg) + 8deg)); }
    66%     { transform: translate(-8px,-10px)    rotate(calc(var(--r,0deg) - 5deg)); }
  }
  .pf-deco-float-ud   { animation: floatUD   var(--dur,7s) ease-in-out var(--del,0s) infinite; }
  .pf-deco-float-lr   { animation: floatLR   var(--dur,8s) ease-in-out var(--del,0s) infinite; }
  .pf-deco-float-diag { animation: floatDiag var(--dur,9s) ease-in-out var(--del,0s) infinite; }
`

const ELEMENTOS = [
  /* ══ HUELLAS ══ */
  { src: huellaImg, t:"3%",  l:"0%",   s:62, r:-20, o:true,  op:0.12, anim:"ud",   dur:"7s",   del:"0s"   },
  { src: huellaImg, t:"19%", l:"94%",  s:46, r: 28, o:false, op:0.11, anim:"lr",   dur:"8s",   del:"1.2s" },
  { src: huellaImg, t:"38%", l:"0%",   s:54, r: 12, o:false, op:0.11, anim:"ud",   dur:"6s",   del:"0.8s" },
  { src: huellaImg, t:"55%", l:"91%",  s:48, r:-33, o:true,  op:0.12, anim:"diag", dur:"9s",   del:"2s"   },
  { src: huellaImg, t:"72%", l:"1%",   s:42, r: 18, o:true,  op:0.10, anim:"lr",   dur:"7s",   del:"0.5s" },
  { src: huellaImg, t:"87%", l:"90%",  s:58, r:-10, o:false, op:0.11, anim:"ud",   dur:"8s",   del:"1.8s" },
  { src: huellaImg, t:"12%", l:"48%",  s:32, r: 42, o:true,  op:0.08, anim:"diag", dur:"10s",  del:"3s"   },
  { src: huellaImg, t:"63%", l:"44%",  s:30, r:-26, o:false, op:0.08, anim:"lr",   dur:"9s",   del:"0.3s" },
  { src: huellaImg, t:"33%", l:"17%",  s:38, r: 15, o:true,  op:0.09, anim:"ud",   dur:"7.5s", del:"1.5s" },
  { src: huellaImg, t:"50%", l:"79%",  s:36, r:-40, o:false, op:0.09, anim:"diag", dur:"8.5s", del:"2.5s" },
  { src: huellaImg, t:"79%", l:"35%",  s:44, r: 22, o:true,  op:0.10, anim:"lr",   dur:"6.5s", del:"0.7s" },
  { src: huellaImg, t:"7%",  l:"27%",  s:34, r:-15, o:false, op:0.08, anim:"ud",   dur:"9.5s", del:"4s"   },
  { src: huellaImg, t:"94%", l:"13%",  s:40, r: 35, o:true,  op:0.09, anim:"diag", dur:"8s",   del:"1s"   },
  { src: huellaImg, t:"27%", l:"63%",  s:28, r:-8,  o:false, op:0.07, anim:"lr",   dur:"11s",  del:"2.2s" },
  { src: huellaImg, t:"69%", l:"57%",  s:32, r: 50, o:true,  op:0.07, anim:"ud",   dur:"10s",  del:"3.5s" },
  { src: huellaImg, t:"45%", l:"33%",  s:26, r:-30, o:false, op:0.07, anim:"diag", dur:"12s",  del:"5s"   },
  { src: huellaImg, t:"16%", l:"82%",  s:36, r: 20, o:true,  op:0.08, anim:"lr",   dur:"8s",   del:"2.8s" },
  { src: huellaImg, t:"83%", l:"67%",  s:30, r:-18, o:false, op:0.07, anim:"ud",   dur:"9s",   del:"1.3s" },
  { src: huellaImg, t:"58%", l:"12%",  s:34, r: 38, o:true,  op:0.08, anim:"diag", dur:"7s",   del:"3.8s" },
  { src: huellaImg, t:"42%", l:"54%",  s:22, r:-45, o:false, op:0.06, anim:"lr",   dur:"13s",  del:"6s"   },
  { src: huellaImg, t:"92%", l:"50%",  s:28, r: 25, o:true,  op:0.07, anim:"ud",   dur:"8.5s", del:"0.2s" },
  { src: huellaImg, t:"23%", l:"40%",  s:20, r:-12, o:false, op:0.05, anim:"diag", dur:"14s",  del:"7s"   },
  { src: huellaImg, t:"76%", l:"74%",  s:26, r: 31, o:true,  op:0.06, anim:"lr",   dur:"11.5s",del:"4.5s" },
  { src: huellaImg, t:"5%",  l:"64%",  s:30, r:-55, o:false, op:0.06, anim:"ud",   dur:"10.5s",del:"2s"   },
  { src: huellaImg, t:"60%", l:"27%",  s:20, r: 15, o:true,  op:0.05, anim:"diag", dur:"15s",  del:"8s"   },
  /* ══ LUPAS ══ */
  { src: lupaImg,  t:"29%", l:"95%",  s:52, r: 22, o:true,  op:0.11, anim:"lr",   dur:"8s",   del:"0.4s" },
  { src: lupaImg,  t:"67%", l:"0%",   s:46, r:-13, o:false, op:0.10, anim:"ud",   dur:"7s",   del:"1.6s" },
  { src: lupaImg,  t:"6%",  l:"74%",  s:40, r: 35, o:false, op:0.09, anim:"diag", dur:"9s",   del:"0.9s" },
  { src: lupaImg,  t:"81%", l:"55%",  s:48, r:-28, o:true,  op:0.10, anim:"lr",   dur:"8.5s", del:"2.8s" },
  { src: lupaImg,  t:"46%", l:"24%",  s:34, r: 16, o:true,  op:0.08, anim:"ud",   dur:"10s",  del:"1.1s" },
  { src: lupaImg,  t:"15%", l:"9%",   s:44, r:-22, o:false, op:0.10, anim:"diag", dur:"7.5s", del:"3.2s" },
  { src: lupaImg,  t:"54%", l:"71%",  s:38, r: 40, o:true,  op:0.09, anim:"lr",   dur:"9.5s", del:"0.6s" },
  { src: lupaImg,  t:"89%", l:"76%",  s:42, r:-18, o:false, op:0.09, anim:"ud",   dur:"8s",   del:"2.4s" },
  { src: lupaImg,  t:"24%", l:"39%",  s:30, r: 10, o:true,  op:0.07, anim:"diag", dur:"11s",  del:"4.2s" },
  { src: lupaImg,  t:"75%", l:"21%",  s:34, r:-45, o:false, op:0.08, anim:"lr",   dur:"10s",  del:"1.9s" },
  { src: lupaImg,  t:"2%",  l:"54%",  s:28, r: 28, o:true,  op:0.07, anim:"ud",   dur:"12s",  del:"5.5s" },
  { src: lupaImg,  t:"60%", l:"86%",  s:32, r:-12, o:false, op:0.08, anim:"diag", dur:"9s",   del:"3.8s" },
  { src: lupaImg,  t:"36%", l:"50%",  s:24, r: 55, o:true,  op:0.06, anim:"lr",   dur:"14s",  del:"7s"   },
  { src: lupaImg,  t:"91%", l:"42%",  s:38, r:-35, o:false, op:0.08, anim:"ud",   dur:"8.5s", del:"0.2s" },
  { src: lupaImg,  t:"22%", l:"20%",  s:26, r: 14, o:true,  op:0.06, anim:"diag", dur:"13s",  del:"4.8s" },
  { src: lupaImg,  t:"70%", l:"40%",  s:28, r:-30, o:false, op:0.06, anim:"lr",   dur:"11.5s",del:"6.5s" },
  { src: lupaImg,  t:"11%", l:"87%",  s:22, r: 18, o:true,  op:0.05, anim:"ud",   dur:"15s",  del:"9s"   },
  { src: lupaImg,  t:"97%", l:"30%",  s:26, r:-8,  o:false, op:0.06, anim:"diag", dur:"12.5s",del:"3s"   },
  { src: lupaImg,  t:"43%", l:"7%",   s:20, r: 42, o:true,  op:0.05, anim:"lr",   dur:"16s",  del:"8.5s" },
  { src: lupaImg,  t:"85%", l:"8%",   s:30, r:-25, o:false, op:0.07, anim:"ud",   dur:"9.5s", del:"1.7s" },
]

export default function FondoAnimado() {
  return (
    <>
      <style>{DECO_CSS}</style>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {ELEMENTOS.map((d, i) => (
          <img key={i} src={d.src} alt=""
            className={`pf-deco-float-${d.anim}`}
            style={{
              position: "absolute", top: d.t, left: d.l,
              width: d.s, height: d.s,
              "--r": `${d.r}deg`, "--dur": d.dur, "--del": d.del,
              opacity: d.op,
              filter: d.o
                ? "sepia(1) saturate(5) hue-rotate(-10deg) brightness(0.9)"
                : "sepia(1) saturate(4) hue-rotate(140deg) brightness(0.65)",
            }}
          />
        ))}
      </div>
    </>
  )
}
