import { additionalInstitutions, institutions } from "@/lib/institutions";
import styles from "./InstitutionMarquee.module.css";

export function InstitutionMarquee() {
  const logoSizes: Record<string, [number, number]> = {"save-the-children":[234,50],"kita":[142,41],"sejong-education":[150,90],"kyobo-life":[240,70],"pyeongtaek-university":[232,60],"gyeongguk-university":[325,56],"gbsa":[139,49],"samsung-fire":[334,96],"lx-mdi":[277,96],"mpva":[319,96],"lg-academy":[1520,344],"kspo":[247,36],"epis":[389,43],"ncrc":[585,96],"kofih":[275,96],"daejin-university":[306,58],"keimyung-university":[406,96],"sebang":[108,24],"alchera":[179,26],"ksia":[608,86],"db-academy":[380,212],"wondershare":[506,64]};

  const rows = [
    { institutions, direction: "left", label: "강사진 주요 출강 기관 로고" },
    { institutions: additionalInstitutions, direction: "right", label: "강사진 추가 출강 기관 로고" },
  ] as const;

  return (
    <div className={styles.marquee} data-institution-marquee>
      {rows.map(({ institutions: rowInstitutions, direction, label }) => (
        <div
          className={styles.viewport}
          role="region"
          aria-label={label}
          tabIndex={0}
          data-institution-viewport
          data-marquee-row
          data-marquee-direction={direction}
          key={direction}
        >
          <div className={`${styles.track} ${direction === "right" ? styles.reverse : ""}`} data-marquee-track>
            {[false, true].map((duplicate) => (
              <div className={`${styles.group} ${duplicate ? styles.duplicate : ""}`} key={String(duplicate)} aria-hidden={duplicate} data-marquee-group>
                {rowInstitutions.map(({ id, name, logo }) => (
                  <div className={styles.item} key={id}>
                    <img src={logo} alt={duplicate ? "" : name} width={logoSizes[id]?.[0]} height={logoSizes[id]?.[1] ?? 48} loading="lazy" decoding="async" draggable={false} data-institution-id={id} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
