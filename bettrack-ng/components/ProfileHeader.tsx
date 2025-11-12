// components/ProfileHeader.tsx
"use client";

type Props = {
  photoUrl: string | null;
  name: string;
  bio: string | null;
  followers: number;
  following: number;
  posts: number;
  rating: number | null; // 1..5
  isEditing: boolean;
  onToggleEdit: () => void;
};

export default function ProfileHeader({
  photoUrl,
  name,
  bio,
  followers,
  following,
  posts,
  rating,
  isEditing,
  onToggleEdit,
}: Props) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Profile"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold truncate">{name}</div>
            <button
              onClick={onToggleEdit}
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#0b0f10]"
            >
              {isEditing ? "Done" : "Edit Profile"}
            </button>
          </div>
          {bio && <div className="mt-1 text-sm text-white/80">{bio}</div>}
          <div className="mt-2 flex gap-4 text-xs">
            <div>
              <span className="font-semibold">{posts}</span> posts
            </div>
            <div>
              <span className="font-semibold">{followers}</span> followers
            </div>
            <div>
              <span className="font-semibold">{following}</span> following
            </div>
            {typeof rating === "number" && <div>★ {rating.toFixed(1)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
