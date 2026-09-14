<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role?->name, $roles)) {
            $payload = ['message' => 'Forbidden. Insufficient permissions.'];

            // Outside production, show exactly what the backend resolved for this
            // request — whether a user was authenticated at all, what role it thinks
            // that user has, and what roles this route requires. This turns "why am I
            // getting 403" from a guessing game into something visible in the response
            // body immediately. Safe to leave in for a local/dev project; if this ever
            // ships to a real production environment, isProduction() already hides it.
            if (! app()->isProduction()) {
                $payload['debug'] = [
                    'authenticated' => (bool) $user,
                    'user_id' => $user?->id,
                    'your_role' => $user?->role?->name,
                    'required_roles' => $roles,
                ];
            }

            return response()->json($payload, 403);
        }

        return $next($request);
    }
}
