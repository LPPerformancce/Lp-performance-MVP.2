import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/lib/userContext";

export function BottomNav() {
  const [location] = useLocation();
  const { currentUser } = useCurrentUser();
  const isCoach = currentUser?.role === "coach";

  const items = isCoach
    ? [
        ["/", "Clients"],
        ["/programs", "Training"],
        ["/nutrition", "Nutrition"],
        ["/check-ins", "Check-ins"],
        ["/messages", "Messages"],
      ]
    : [
        ["/", "Home"],
        ["/training", "Training"],
        ["/nutrition", "Nutrition"],
        ["/check-ins", "Check-in"],
        ["/messages", "Messages"],
      ];

  return (
    <nav className="bottom-nav">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className={location === href ? "active" : ""}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
