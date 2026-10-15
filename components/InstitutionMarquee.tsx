import { additionalInstitutions, institutions } from "@/lib/institutions";
import styles from "./InstitutionMarquee.module.css";

export function InstitutionMarquee() {
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
                    <img src={logo} alt={duplicate ? "" : name} height="48" draggable={false} data-institution-id={id} />
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
