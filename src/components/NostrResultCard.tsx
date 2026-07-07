import { Link } from 'react-router-dom';
import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { MessageSquare, Repeat2, Heart, FileText, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { cn } from '@/lib/utils';
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import {
  kindLabel,
  getTitle,
  getSummary,
  eventToNip19,
  timeAgo,
  truncateText,
  npubShort,
} from '@/lib/nostrHelpers';

interface NostrResultCardProps {
  event: NostrEvent;
  className?: string;
}

export function NostrResultCard({ event, className }: NostrResultCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const nip19Id = eventToNip19(event);
  const displayName = metadata?.name || metadata?.display_name || npubShort(event.pubkey);
  const avatar = metadata?.picture ? sanitizeUrl(metadata.picture) : '';

  // Render based on kind
  if (event.kind === 0) {
    return <ProfileResultCard event={event} metadata={metadata} avatar={avatar} nip19Id={nip19Id} className={className} />;
  }

  if (event.kind === 30023) {
    return (
      <ArticleResultCard
        event={event}
        metadata={metadata}
        displayName={displayName}
        avatar={avatar}
        nip19Id={nip19Id}
        className={className}
      />
    );
  }

  // Default: note or other kind
  return (
    <NoteResultCard
      event={event}
      metadata={metadata}
      displayName={displayName}
      avatar={avatar}
      nip19Id={nip19Id}
      className={className}
    />
  );
}

/* ─── Profile result ─── */
function ProfileResultCard({ event, metadata, avatar, nip19Id, className }: {
  event: NostrEvent;
  metadata: NostrMetadata | undefined;
  avatar: string;
  nip19Id: string;
  className?: string;
}) {
  let parsedMeta: NostrMetadata | undefined = metadata;
  if (!parsedMeta) {
    try {
      parsedMeta = JSON.parse(event.content) as NostrMetadata;
    } catch {
      // ignore
    }
  }

  const name = parsedMeta?.name || parsedMeta?.display_name || npubShort(event.pubkey);
  const about = parsedMeta?.about || '';
  const profilePic = parsedMeta?.picture ? sanitizeUrl(parsedMeta.picture) : avatar;
  const nip05 = parsedMeta?.nip05;

  return (
    <Link to={`/${nip19Id}`} className={cn('block group', className)}>
      <div className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
        <Avatar size="lg" className="shrink-0 ring-2 ring-primary/10">
          {profilePic && <AvatarImage src={profilePic} alt={name} />}
          <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {name}
            </span>
            <Badge variant="outline" className="text-[10px] shrink-0 border-nostr/30 text-nostr">
              Profile
            </Badge>
          </div>
          {nip05 && (
            <p className="text-xs text-muted-foreground font-mono mb-1.5 truncate">{nip05}</p>
          )}
          {about && (
            <p className="text-sm text-muted-foreground line-clamp-2">{about}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Article result ─── */
function ArticleResultCard({ event, displayName, avatar, nip19Id, className }: {
  event: NostrEvent;
  metadata: NostrMetadata | undefined;
  displayName: string;
  avatar: string;
  nip19Id: string;
  className?: string;
}) {
  const title = getTitle(event) || 'Untitled Article';
  const summary = getSummary(event) || truncateText(event.content, 200);

  return (
    <Link to={`/${nip19Id}`} className={cn('block group', className)}>
      <div className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
        <div className="flex items-center gap-2 mb-2.5">
          <Avatar size="sm" className="shrink-0">
            {avatar && <AvatarImage src={avatar} alt={displayName} />}
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground/60">{timeAgo(event.created_at)}</span>
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0 border-nostr/30 text-nostr">
            <FileText className="w-3 h-3 mr-0.5" />
            Article
          </Badge>
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
          {title}
        </h3>
        {summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">{truncateText(summary, 300)}</p>
        )}
        <EventMeta event={event} />
      </div>
    </Link>
  );
}

/* ─── Note result ─── */
function NoteResultCard({ event, displayName, avatar, nip19Id, className }: {
  event: NostrEvent;
  metadata: NostrMetadata | undefined;
  displayName: string;
  avatar: string;
  nip19Id: string;
  className?: string;
}) {
  return (
    <Link to={`/${nip19Id}`} className={cn('block group', className)}>
      <div className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
        <div className="flex items-center gap-2 mb-2.5">
          <Avatar size="sm" className="shrink-0">
            {avatar && <AvatarImage src={avatar} alt={displayName} />}
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground/60">{timeAgo(event.created_at)}</span>
          {event.kind !== 1 && (
            <Badge variant="outline" className="text-[10px] ml-auto shrink-0 border-nostr/30 text-nostr">
              {kindLabel(event.kind)}
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
          {truncateText(event.content, 400)}
        </p>
        <EventMeta event={event} />
      </div>
    </Link>
  );
}

/* ─── Engagement metrics bar ─── */
function EventMeta({ event }: { event: NostrEvent }) {
  // Extract basic engagement hints from tags if available
  const hashtags = event.tags
    .filter(([n]) => n === 't')
    .map(([, v]) => v)
    .slice(0, 3);

  return (
    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/70">
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        <span>Reply</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Repeat2 className="w-3 h-3" />
        <span>Repost</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart className="w-3 h-3" />
        <span>React</span>
      </span>
      {hashtags.length > 0 && (
        <div className="ml-auto flex items-center gap-1.5">
          {hashtags.map((tag) => (
            <span key={tag} className="text-primary/60 font-mono">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
