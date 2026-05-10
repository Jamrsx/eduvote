/** Public URL for the EduVote mark (`public/images/eduvotelogo.png`). */
export const EDUVOTE_LOGO_URL = '/images/eduvotelogo.png';

/** Full brand lockup for the login page (`public/images/eduvote-removebg-preview.png`). */
export const EDUVOTE_LOGIN_LOGO_URL = '/images/eduvote-removebg-preview.png';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm dark:bg-white/10">
                <img
                    src={EDUVOTE_LOGO_URL}
                    alt=""
                    className="size-full object-contain"
                    width={32}
                    height={32}
                    decoding="async"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    EduVote
                </span>
            </div>
        </>
    );
}
