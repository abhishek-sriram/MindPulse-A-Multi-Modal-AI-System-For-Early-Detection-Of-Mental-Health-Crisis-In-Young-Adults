import { Phone, MessageCircle, ExternalLink } from "lucide-react";

export function CrisisResources({ prominent = false }: { prominent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${prominent ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/30"}`}>
      <h3 className={`font-serif font-semibold mb-3 ${prominent ? "text-destructive text-lg" : "text-sm text-muted-foreground"}`}>
        {prominent ? "⚠️ Crisis Resources (India) — Get Help Now" : "Crisis Resources (India)"}
      </h3>

      <div className="grid gap-3 sm:grid-cols-3">
        
        {/* Call Helpline */}
        <a href="tel:18005990019" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Phone className="h-4 w-4 shrink-0" />
          <span><strong>1800-599-0019</strong> Kiran Mental Health Helpline</span>
        </a>

        {/* iCALL Support */}
        <a href="tel:9152987821" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span><strong>+91 9152987821</strong> iCALL Mental Health Support</span>
        </a>

        {/* Govt Website */}
        <a
          href="https://www.mohfw.gov.in"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span>Ministry of Health & Family Welfare (India)</span>
        </a>

      </div>
    </div>
  );
}
