@extends('admin.layout')
@section('title', 'Homepage slides')
@section('crumbs', 'Homepage slides')
@section('top-actions')<a href="{{ route('admin.homepage-slides.create') }}" class="btn">New slide</a>@endsection

@section('content')
    <div class="page-head"><div><h1>Homepage slides</h1><p class="muted">The photos that rotate at the top of the home page. They show in the order of the Position number. Turn one off to hide it without deleting it.</p></div></div>

    <section class="card">
        @if ($slides->isEmpty())
            <p class="empty">No slides. The home page shows no photo banner until you add one. <a href="{{ route('admin.homepage-slides.create') }}">Add a slide</a>.</p>
        @else
            <div class="table-wrap"><table>
                <thead><tr><th>Photo</th><th>Headline</th><th>Position</th><th>Status</th><th></th></tr></thead>
                <tbody>
                @foreach ($slides as $s)
                    <tr>
                        <td><img src="{{ str_starts_with($s->image, 'assets/') ? '/'.$s->image : asset('uploads/'.$s->image) }}" alt="" style="width:120px;height:72px;object-fit:cover;border-radius:6px"></td>
                        <td><b>{{ str_replace('*', '', $s->title) }}</b>@if ($s->kicker)<br><span class="muted">{{ $s->kicker }}</span>@endif</td>
                        <td>{{ $s->sort_order }}</td>
                        <td><span class="badge {{ $s->is_active ? 'on' : 'off' }}">{{ $s->is_active ? 'Showing' : 'Hidden' }}</span></td>
                        <td class="num"><a href="{{ route('admin.homepage-slides.edit', $s) }}" class="btn ghost sm">Edit</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
        @endif
    </section>
@endsection
