/// Spring Boot pagination model matching Angular Page<T>.
class Page<T> {
  final List<T> content;
  final int totalElements;
  final int totalPages;
  final int size;
  final int number;
  final bool last;

  Page({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.size,
    required this.number,
    required this.last,
  });

  factory Page.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return Page(
      content: (json['content'] as List<dynamic>)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      totalElements: json['totalElements'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
      size: json['size'] as int? ?? 0,
      number: json['number'] as int? ?? 0,
      last: json['last'] as bool? ?? true,
    );
  }
}

class Pageable {
  final int page;
  final int size;

  Pageable({required this.page, required this.size});

  Map<String, String> toQueryParams() => {
    'page': page.toString(),
    'size': size.toString(),
  };
}
